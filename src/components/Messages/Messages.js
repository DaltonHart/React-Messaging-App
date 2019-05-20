import React, { Component } from 'react';
import { Segment, Comment } from 'semantic-ui-react';
import firebase from '../../firebase';
import MessagesHeader from './MessagesHeader';
import MessageForm from './MessagesForm';
import Message from './Message';

class Messages extends Component {
	state = {
		privateChannel: this.props.isPrivateChannel,
		privateMessagesRef: firebase.database().ref('privateMessages'),
		messagesRef: firebase.database().ref('messages'),
		channel: this.props.currentChannel,
		isChannelStarred: false,
		user: this.props.currentUser,
		usersRef: firebase.database().ref('users'),
		messages: [],
		messagesLoading: true,
		progressBar: false,
		numUniqueUsers: '',
		searchTerm: '',
		searchLoading: false,
		searchResults: []
	};

	componentDidMount() {
		const { channel, user } = this.state;
		if (channel && user) {
			this.addListeners(channel.id);
			this.addUserStarsListener(channel.id, user.uid);
		}
	}

	addUserStarsListener = (channelId, userId) => {
		this.state.usersRef
			.child(userId)
			.child('starred')
			.once('value')
			.then(data => {
				if (data.val() !== null) {
					const channelIds = Object.keys(data.val());
					const prevStarred = channelIds.includes(channelId);
					this.setState({ isChannelStarred: prevStarred });
				}
			});
	};

	addListeners = channelId => {
		this.addMessageListener(channelId);
	};

	addMessageListener = channelId => {
		let loadedMessages = [];
		const ref = this.getMessagesRef();
		ref.child(channelId).on('child_added', snap => {
			loadedMessages.push(snap.val());
			this.setState({
				messages: loadedMessages,
				messagesLoading: false
			});
			this.countUniqueUsers(loadedMessages);
		});
	};

	getMessagesRef = () => {
		const { messagesRef, privateMessagesRef, privateChannel } = this.state;
		return privateChannel ? privateMessagesRef : messagesRef;
	};

	handleStar = () => {
		this.setState(
			prevState => ({
				isChannelStarred: !prevState.isChannelStarred
			}),
			() => this.starChannel()
		);
	};

	starChannel = () => {
		if (this.state.isChannelStarred) {
			this.state.usersRef.child(`${this.state.user.uid}/starred`).update({
				[this.state.channel.id]: {
					name: this.state.channel.name,
					details: this.state.channel.details,
					createdBy: {
						name: this.state.channel.createdBy.name,
						avatar: this.state.channel.createdBy.avatar
					}
				}
			});
		} else {
			this.state.usersRef
				.child(`${this.state.user.uid}/starred`)
				.child(this.state.channel.id)
				.remove(err => {
					if (err !== null) console.error(err);
				});
		}
	};

	countUniqueUsers = messages => {
		const uniqueUsers = messages.reduce((acc, message) => {
			if (!acc.includes(message.user.name)) {
				acc.push(message.user.name);
			}
			return acc;
		}, []);
		const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
		const numUniqueUsers = `${uniqueUsers.length} user${plural ? 's' : ''}`;
		this.setState({ numUniqueUsers });
	};

	displayMessages = messages =>
		messages.length > 0 &&
		messages.map(message => (
			<Message
				key={message.timestamp}
				message={message}
				user={this.state.user}
			/>
		));

	isProgressBarVisible = percent => {
		if (percent > 0) {
			this.setState({ progressBar: true });
		}
	};

	displayChannelName = channel =>
		channel ? `${this.state.privateChannel ? '@' : '#'}${channel.name}` : '';

	handleSearchChange = e => {
		this.setState({ searchTerm: e.target.value, searchLoading: true }, () => {
			this.handleSearchMessages();
		});
	};

	handleSearchMessages = () => {
		const channelMessages = [...this.state.messages];
		const regex = new RegExp(this.state.searchTerm, 'gi');
		const searchResults = channelMessages.reduce((acc, message) => {
			if (
				(message.content && message.content.match(regex)) ||
				message.user.name.match(regex)
			) {
				acc.push(message);
			}
			return acc;
		}, []);
		this.setState({ searchResults });
		setTimeout(() => this.setState({ searchLoading: false }), 1000);
	};

	render() {
		const {
			messagesRef,
			channel,
			user,
			messages,
			progressBar,
			numUniqueUsers,
			searchTerm,
			searchResults,
			searchLoading,
			privateChannel,
			isChannelStarred
		} = this.state;
		return (
			<>
				<MessagesHeader
					channelName={this.displayChannelName(channel)}
					numUniqueUsers={numUniqueUsers}
					handleSearchChange={this.handleSearchChange}
					searchLoading={searchLoading}
					isPrivateChannel={privateChannel}
					handleStar={this.handleStar}
					isChannelStarred={isChannelStarred}
				/>

				<Segment>
					<Comment.Group
						className={progressBar ? 'messages__progress' : 'messages'}>
						{searchTerm
							? this.displayMessages(searchResults)
							: this.displayMessages(messages)}
					</Comment.Group>
				</Segment>

				<MessageForm
					messagesRef={messagesRef}
					currentChannel={channel}
					currentUser={user}
					isProgressBarVisible={this.isProgressBarVisible}
					isPrivateChannel={privateChannel}
					getMessagesRef={this.getMessagesRef}
				/>
			</>
		);
	}
}

export default Messages;
