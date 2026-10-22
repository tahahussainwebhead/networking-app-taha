import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const handlers = useRef({});
  const [connected, setConnected] = useState(false);

  const attach = (socket, event) => {
    if (!socket._socialListeners) socket._socialListeners = {};
    if (socket._socialListeners[event]) return;
    const dispatch = (...args) => {
      (handlers.current[event] || []).forEach((h) => h(...args));
    };
    socket.on(event, dispatch);
    socket._socialListeners[event] = dispatch;
  };

  const on = (event, cb) => {
    if (!handlers.current[event]) handlers.current[event] = [];
    const arr = handlers.current[event];
    arr.push(cb);
    const socket = socketRef.current;
    if (socket && socket.connected) attach(socket, event);
    return () => {
      const i = arr.indexOf(cb);
      if (i !== -1) arr.splice(i, 1);
    };
  };

  useEffect(() => {
    if (!token) {
      setConnected(false);
      return;
    }
    const socket = io("/", { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      for (const ev of Object.keys(handlers.current)) {
        attach(socket, ev);
      }
    });
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ on, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);