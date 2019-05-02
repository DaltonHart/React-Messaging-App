import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import Login from './components/Auth/Login';
import Spinner from './Spinner';
import Register from './components/Auth/Register';
import * as serviceWorker from './serviceWorker';
import {
	BrowserRouter as Router,
	Switch,
	Route,
	withRouter
} from 'react-router-dom';
import firebase from './firebase';

import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { setUser } from './actions';

import 'semantic-ui-css/semantic.min.css';
import rootReducer from './reducers';

const store = createStore(rootReducer, composeWithDevTools());

class Root extends Component {
	componentDidMount() {
		console.log(this.props.isLoading);
		firebase.auth().onAuthStateChanged(user => {
			if (user) {
				this.props.setUser(user);
				this.props.history.push('/');
			}
		});
	}
	render() {
		return this.props.isLoading ? (
			<Spinner />
		) : (
			<Switch>
				<Route path="/login" component={Login} />
				<Route path="/register" component={Register} />
				<Route exact path="/" component={App} />
				<Route
					path="/*"
					render={() => {
						return <p>404</p>;
					}}
				/>
			</Switch>
		);
	}
}

const mapStateFromProps = state => ({
	isLoading: state.user.isLoading
});

const RootWithAuth = withRouter(
	connect(
		mapStateFromProps,
		{ setUser }
	)(Root)
);

ReactDOM.render(
	<Provider store={store}>
		<Router>
			<RootWithAuth />
		</Router>
	</Provider>,
	document.getElementById('root')
);

serviceWorker.unregister();
