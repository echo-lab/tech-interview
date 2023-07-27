import { createSlice } from '@reduxjs/toolkit'

export const pcsSlice = createSlice({
  name: 'pcs',
  initialState: {
    value: [] // [{id, peer}]
  },
  reducers: {
    push: (state, action) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value.push(action.payload);
    },
    remove: (state, action) => {
      state.value = state.value.filter(item => item.id !== action.payload.id);
    },
    set: (state, action) => {
      state.value = action.payload;
    },
  }
})

// Action creators are generated for each case reducer function
export const { push, remove, set } = pcsSlice.actions

export default pcsSlice.reducer