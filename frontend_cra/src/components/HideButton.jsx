import { useState } from "react"
export default function HideButton (props) {
	const [hide, setHide] = useState(false)
	return (
			
		<button 
			className='bg-vt-maroon text-vt-white p-1 enabled:hover:brightness-125 disabled:bg-vt-grey w-24' 
			onClick={()=>{setHide(!hide);props.handleHide()}}
		>
			{hide? "Show":"Hide"} Caret

		</button>
	)
}