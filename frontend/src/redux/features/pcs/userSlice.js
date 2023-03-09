import { createSlice } from '@reduxjs/toolkit'

export const nameSlice = createSlice({
  name: 'user',
  initialState: {
    value: '', // [{id, peer}]
    color: '#fff',
    lightColor: '#fff'
  },
  reducers: {
    setName: (state, action) => {
      state.value = action.payload;
    },
    setColor: (state, action) => {

      state.color = action.payload[0];
      state.lightColor = action.payload[1];
    }
  }
})

// Action creators are generated for each case reducer function
export const { setName, setColor } = nameSlice.actions

export default nameSlice.reducer