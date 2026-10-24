import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('stms_token');
    const newSocket = io('/', {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // In-app notifications in real-time
    newSocket.on('notification:received', (notification) => {
      toast.info(notification.message, notification.title);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Real-time task changes
    newSocket.on('task:updated', (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', updatedTask._id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    });

    newSocket.on('task:created', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    });

    newSocket.on('task:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    });

    // Real-time comments
    newSocket.on('comment:added', (comment) => {
      queryClient.invalidateQueries({ queryKey: ['comments', comment.task] });
    });

    newSocket.on('comment:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    });

    // Real-time team updates
    newSocket.on('team:updated', (team) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', team._id] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinTask = useCallback(
    (taskId) => {
      if (socket && taskId) {
        socket.emit('join:task', taskId);
      }
    },
    [socket]
  );

  const leaveTask = useCallback(
    (taskId) => {
      if (socket && taskId) {
        socket.emit('leave:task', taskId);
      }
    },
    [socket]
  );

  const joinTeam = useCallback(
    (teamId) => {
      if (socket && teamId) {
        socket.emit('join:team', teamId);
      }
    },
    [socket]
  );

  const leaveTeam = useCallback(
    (teamId) => {
      if (socket && teamId) {
        socket.emit('leave:team', teamId);
      }
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinTask,
        leaveTask,
        joinTeam,
        leaveTeam,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
