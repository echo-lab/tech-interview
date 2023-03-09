import { createSlice } from '@reduxjs/toolkit'

export const codeSlice = createSlice({
  name: 'code',
  initialState: {
    value: null // [{id, peer}]
  },
  reducers: {
    setCode: (state, action) => {
      state.value = action.payload;
    },
  }
})

// Action creators are generated for each case reducer function
export const { setCode } = codeSlice.actions

export default codeSlice.reducer