import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import { PrivateRoute } from './private-routing';
import { Login } from '../login';
import { Spin } from 'antd';
import './style.css';
import { Store } from '../store/session/session.model';
import { initSession } from '../store/session';
import { Dashboard } from '../dashboard';
import { DeviceList } from '../devices';
import { UserList } from '../user';
import { Apps } from '../apps/apps';
import { Accounts } from '../account';
import { EventList } from '../event/index';
import CreateEvent from '../event/createEvent';
import Channels from '../event/createChannels';
import ModifyData from '../event/ModifyData/ModifyData';



export const AppRouter: React.FC = () => {
  const dispatch = useDispatch();
  const session = useSelector((state: Store) => state.session);

  useEffect(() => {
    getAuth().onAuthStateChanged((user) => {
      dispatch(initSession() as any);
      console.log(user, 'user');
    });
  }, [dispatch]);

  if (!session?.hasSession) {
    return (
      <div className="loadingSpinner">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Outlet />}>
          <Route index element={<Navigate to={'/login'} />} />
          <Route
            path="/login"
            element={
              session?.isAuthenticated ? (
                <Navigate to="/home/dashboard" />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/home"
            element={
              <PrivateRoute isAuthenticated={session?.isAuthenticated} />
            }
          >
            <Route path="/home/dashboard" element={<Dashboard />} />
            <Route path="/home/device" element={<DeviceList />} />
            <Route path="/home/user" element={<UserList />} />
            <Route path="/home/apps" element={<Apps/>} />
            <Route path="/home/account" element={<Accounts />} />
            <Route path="*" element={<p>404 Not Found</p>} />
            <Route path="/home/Event" element={<EventList />} />
            <Route path="/home/CreateEvent" element={<CreateEvent />} />
            <Route path="/home/Channels" element={<Channels />} />
            <Route path="/home/ModifyData/:eventId" element={<ModifyData />} />
            <Route path="*" element={<p>404 Not Found</p>} /> 
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
