import { configureStore } from '@reduxjs/toolkit'
import pcsReducer from './features/pcs/pcsSlice';
import codeReducer from './features/pcs/codeSlice';
import nameReducer from './features/pcs/userSlice';

export default configureStore({
  reducer: {
    pcs: pcsReducer,
    code: codeReducer,
    user: nameReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['your/action/type'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
})