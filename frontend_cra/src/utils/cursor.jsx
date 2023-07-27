import { EditorView, Decoration, DecorationSet, WidgetType, showTooltip } from "@codemirror/view"
import { StateField, StateEffect } from "@codemirror/state"
import {keymap} from "@codemirror/view"

export const addCursor = StateEffect.define();
export const remoteCursor = StateEffect.define();
export const deleteCursor = StateEffect.define();


const idToClass = ["Interviewer", "Interviewee"] //idToClass[id-1]
  
class ToolTipWidget extends WidgetType {
  id = 1
  hidden = false
  constructor(id, hidden=false) { 
    super() 
    this.id = id
    this.hidden = hidden
  }

  eq(other) { return other.id == this.id }

  toDOM() {
    /*
    let overwrap = document.createElement("div")
    overwrap.className = 'cm-tooltip-cursor-wrap'

    
    let wrap = document.createElement("div")
    wrap.className = `cm-tooltip-cursor cm-tooltip cm-tooltip-above cm-tooltip-${this.id}`
    wrap.textContent = `${idToClass[this.id - 1]}`
    const arrow = document.createElement("div");
    arrow.className = "cm-tooltip-arrow";

    wrap.appendChild(arrow)
    overwrap.appendChild(wrap)
    return overwrap
    */
    
    let caret = document.createElement("div")
  
    caret.className = 'cm-caret'
    if (this.hidden) {
      caret.className = 'cm-hidden'
    }

    let caret_content = document.createElement("span")
    caret_content.className = `cm-caret-inner cm-caret-${this.id}`
    caret_content.textContent = ''
    caret.appendChild(caret_content)

    let caret_wrapper = document.createElement("div")
    caret_wrapper.className = `cm-caret-wrapper`
    
    let caret_label = document.createElement("div")
    caret_label.className=`cm-caret-label cm-caret-label-${this.id}`
    caret_label.textContent = `${idToClass[this.id - 1]}`

    caret_wrapper.appendChild(caret_label)
    caret.appendChild(caret_wrapper)
    return caret
  }

  ignoreEvent() { return false }
}


const underlineField = StateField.define({
    create() {
        return Decoration.none
    },
    update(cursors, tr) {
        const additions = []
        let cursorTransacions = cursors.map(tr.changes)
        for (const e of tr.effects) {
          if (e.is(remoteCursor)) {
            const additions = []
    
            if (e.value.from !== e.value.to){
              additions.push(
                Decoration.mark({class: "cm-highlight-" + e.value.id, id:e.value.id}).range(e.value.from, e.value.to)
              )
            }
            //console.log(e.value.id)

            if (e.value.from === e.value.to ){
              additions.push(Decoration.widget({
                widget: new ToolTipWidget(e.value.id),
                id: e.value.id,
                block: false,
                side: 1
              }).range(e.value.to))
            }

            cursorTransacions = cursorTransacions.update({
              add: additions,
              filter: (_from, _to, value ) => {
                if (value && value.spec && value.spec.id === e.value.id) {
                  return false;
                }
                return true;
              }
            })
          }
          else if (e.is(addCursor)){
            //console.log("Yooo for now")
          }
          else if (e.is(deleteCursor)){
            console.log("ei cut that")
            cursorTransacions = cursorTransacions.update({
              add: [],
              filter: (_from, _to, value ) => {
                if (value && value.spec && value.spec.id === e.value.id) {
                  return false;
                }
                return true;
              }
            })
          }

        }
		  return cursorTransacions
    },
    provide: f => EditorView.decorations.from(f)
})

/*
const cursorTheme = EditorView.baseTheme({
    ".cm-underline": { textDecoration: "underline 3px red" },
    ".cm-highlight-1": {
		backgroundColor: "#b1b6d4"
	},
	".cm-highlight-2": {
		backgroundColor: "#F76E6E55"
	},
    ".cm-tooltip.cm-tooltip-cursor": {
        backgroundColor: "#66b",
        color: "white",
        border: "none",
        padding: "2px 7px",
        borderRadius: "4px",
        "& .cm-tooltip-arrow:before": {
          borderTopColor: "#66b"
        },
        "& .cm-tooltip-arrow:after": {
          borderTopColor: "transparent"
        }
    }
})
*/

const cursorTheme = EditorView.baseTheme({
  ".cm-highlight-1": {
		backgroundColor: "#861F41",
    opacity: "0.8"
	},
  ".cm-hidden": {
    visibility: "hidden"
  },
	".cm-highlight-2": {
		backgroundColor: "#003C71",
    opacity: "0.6"

	},
  ".cm-caret": {
    display: "inline-block",
    opacity: "0.8"
  },
  ".cm-caret-inner": {
    padding: "0px",
    zIndex: "10",
  },
  ".cm-caret-wrapper": {
    width: "0px", 
    height: "0px",
    opacity: "0.6",
    display: "inline-block",
  },
  ".cm-caret-label": {
    border: "none",
		position: "absolute",
		marginTop: "-32px",
		marginLeft: "-2px",
		zIndex: "9999",
    color: "white"
  
  },
  ".cm-caret-label-1": {
		backgroundColor: "#861F41 !important",
	},
  ".cm-caret-label-2": {
		backgroundColor: "#003C71 !important",
	},
  ".cm-caret-1": {
    borderLeft: "2px solid #861F41",
  },
  ".cm-caret-2": {
    borderLeft: "2px solid #003C71",
  },

  ".cm-tooltip.cm-tooltip-cursor": {
    
		border: "none",
		padding: "2px 7px",
		borderRadius: "4px",
		position: "absolute",
		marginTop: "-44px",
		marginLeft: "-13px",
		zIndex: "10",
    color: "white",
    "& .cm-tooltip-arrow:after": {
			borderTopColor: "transparent"
		},
  },
  ".cm-tooltip-cursor-wrap": {
    width: "0px", 
    height: "0px",
    display: "inline-block",
    opacity: "0.6"
  },

  ".cm-tooltip-1": {
		backgroundColor: "#861F41 !important",
    "& .cm-tooltip-arrow": {
      color: "#861F41 !important"
    },
		"& .cm-tooltip-arrow:before": {
			borderTopColor: "#861F41 !important",
		},
	},
	".cm-tooltip-2": {
		backgroundColor: "#003C71 !important",
    "& .cm-tooltip-arrow": {
      color: "#003C71 !important"
    },
		"& .cm-tooltip-arrow:before": {
			borderTopColor: "#003C71 !important",
		},
	},
})


  

export const underlineExtenstion = (id) => {
    return [
		underlineField,
		cursorTheme,
		EditorView.updateListener.of(update => {
      //console.log(update.transactions)
      //console.log("ID here" + id)
      //console.log(update)
			update.transactions.forEach(e => { 
        //console.log(update)
				if (e.selection) {
					const cursor = {
            id,
						from: e.selection.ranges[0].from,
						to: e.selection.ranges[0].to
					}
                    update.view.dispatch({
						effects: addCursor.of(cursor)
					})
				}
			})
		}),
	];
}