import React, { Component } from 'react';
import firebase from '../../firebase';
import { connect } from 'react-redux';
import { setCurrentChannel } from '../../actions';
import { Menu, Icon, Modal, Form, Input, Button } from 'semantic-ui-react';

class Channels extends Component {
	state = {
		user: this.props.currentUser,
		channels: [],
		channelName: '',
		channelDetails: '',
		channelsRef: firebase.database().ref('channels'),
		modal: false
	};

	componentDidMount() {
		this.addListeners();
	}

	addListeners = () => {
		let loadedChannels = [];
		this.state.channelsRef.on('child_added', snap => {
			loadedChannels.push(snap.val());
			this.setState({ channels: loadedChannels });
		});
	};

	addChannel = () => {
		const { channelsRef, channelDetails, channelName, user } = this.state;
		const key = channelsRef.push().key;

		const newChannel = {
			id: key,
			details: channelDetails,
			name: channelName,
			createdBy: {
				name: user.displayName,
				avatar: user.photoURL
			}
		};

		channelsRef
			.child(key)
			.update(newChannel)
			.then(() => {
				this.setState({ channelName: '', channelDetails: '' });
				this.closeModal();
				console.log('channel added');
			})
			.catch(err => console.log(err));
	};

	handleChange = e => this.setState({ [e.target.name]: e.target.value });

	changeChannel = channel => {
		this.props.setCurrentChannel(channel);
	};

	handleSubmit = e => {
		e.preventDefault();
		if (this.isFormValid(this.state)) {
			this.addChannel();
		}
	};

	isFormValid = ({ channelName, channelDetails }) =>
		channelName && channelDetails;

	displayChannels = channels =>
		channels.length > 0 &&
		channels.map(channel => (
			<Menu.Item
				key={channel.id}
				onClick={() => this.setCurrentChannel(channel)}
				name={channel.name}
				style={{ opacity: 0.7 }}>
				# {channel.name}
			</Menu.Item>
		));

	closeModal = () => this.setState({ modal: false });
	openModal = () => this.setState({ modal: true });

	render() {
		const { channels, modal } = this.state;
		return (
			<>
				<Menu.Menu style={{ paddingBottom: '2em' }}>
					<Menu.Item>
						<span>
							<Icon name="exchange" /> CHANNELS
						</span>{' '}
						({channels.length})<Icon name="add" onClick={this.openModal} />
					</Menu.Item>
					{this.displayChannels(channels)}
				</Menu.Menu>

				<Modal basic open={modal} onClose={this.closeModal}>
					<Modal.Header>Add a Channel</Modal.Header>
					<Modal.Content>
						<Form onSubmit={this.handleSubmit}>
							<Form.Field>
								<Input
									fluid
									label="Name of Channel"
									name="channelName"
									onChange={this.handleChange}
								/>
							</Form.Field>
							<Form.Field>
								<Input
									fluid
									label="About the Channel"
									name="channelDetails"
									onChange={this.handleChange}
								/>
							</Form.Field>
						</Form>
					</Modal.Content>
					<Modal.Actions>
						<Button color="green" inverted onClick={this.handleSubmit}>
							<Icon name="checkmark" /> Add
						</Button>
						<Button color="red" inverted onClick={this.closeModal}>
							<Icon name="remove" /> Cancel
						</Button>
					</Modal.Actions>
				</Modal>
			</>
		);
	}
}

export default connect(
	null,
	setCurrentChannel
)(Channels);
