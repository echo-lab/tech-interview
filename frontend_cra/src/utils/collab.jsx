import { ViewPlugin } from "@codemirror/view"
import { Text, ChangeSet, Facet } from "@codemirror/state"
import { StateEffect, StateField, EditorState } from "@codemirror/state"
import {
  receiveUpdates,
  sendableUpdates,
  collab,
  getSyncedVersion
} from "@codemirror/collab"
import { addCursor, remoteCursor, deleteCursor } from "./cursor"

export const showCaret = Facet.define()

export const showCaretEffect =  StateEffect.define()
export const showCaretField = StateField.define({
  create: () => {return {show: true, from: 0, to: 0}},
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(showCaretEffect)){
        return {
          show: e.value.show,
          from: tr.startState.selection.ranges[0].from,
          to: tr.startState.selection.ranges[0].to,
        }
      }
      
    }
    return {
      show: tr.startState.field(showCaretField).show,
      from:tr.startState.field(showCaretField).from,
      to: tr.startState.field(showCaretField).to
    }
  },
})


function pushUpdates(socket, version, fullUpdates, roomId) {
  // Strip off transaction data
  //console.log(fullUpdates)
  const updates = fullUpdates.map(u => {
   //console.log(u.origin.startState.field(showCaretField))
   let effects = []
   let caret = true
   u.effects.forEach(e => {
    if (e.is(addCursor)){
      console.log("add")
      
      if (u.origin.startState.field(showCaretField).show ){
        effects.push(e)
        caret = true
      }
      else{
        console.log("dont show")
        if (e.value && e.value.id && e.value.from !== undefined ) {
          //console.log("Cursor bonk:")
          const cursor = {
            id: e.value.id,
            from: e.value.from,
            to: e.value.to,
          }
          effects.push(deleteCursor.of(cursor))
          caret = false
        }
      }
    }
    else if (e.is(showCaretEffect)){

      console.log("hide show")
      if (e.value.show){
        const cursor = {
          id: e.value.id,
          from: e.value.from,
          to: e.value.to,
        }
        effects.push(addCursor.of(cursor))
        caret = true
      }
      else {
        const cursor = {
          id: e.value.id,
          from: e.value.from,
          to: e.value.to,
        }
        effects.push(deleteCursor.of(cursor))
        caret = false
      }
    }
    
   })
   return {
    clientID: u.clientID,
    changes: u.changes.toJSON(),
    effects: effects,
    caret: caret
  }
   /*
    console.log(u)
    if (u.origin.startState.field(showCaretField).show ){
      console.log("trying to show?")
      return {
        clientID: u.clientID,
        changes: u.changes.toJSON(),
        effects: u.effects,
        caret: true
      }
    }
    else{
      console.log("delete")
      //console.log("not trying to push effects")
      let effects = []
      if (u.effects){
        u.effects.forEach(e => {
          if (e.value && e.value.id && e.value.from !== undefined ) {
            //console.log("Cursor bonk:")
            const cursor = {
              id: e.value.id,
              from: e.value.from,
              to: e.value.to,
            }
            effects.push(deleteCursor.of(cursor))
          }
        })
      }
      return {
        clientID: u.clientID,
        changes: u.changes.toJSON(),
        effects: effects, //effects,
        caret: false
      }

    }
    */
  })

  //console.log(updates)

  return new Promise(function(resolve) {
    socket.emit("pushUpdates", version, JSON.stringify(updates), roomId, )

    socket.once("pushUpdateResponse", function(status) {
      resolve(status)
    })
  })
}

function pullUpdates(socket, version, roomId, id) {
  return new Promise(function(resolve) {
    socket.emit("pullUpdates", version, roomId)

    socket.once("pullUpdateResponse", function(updates) {
      resolve(JSON.parse(updates))
    })
  }).then(updates => 
    updates.map(u => {
      //console.log(u.effects[0])
      if (u.effects[0]) {
        //console.log("been here")
        const effects = []
        u.effects.forEach(effect => {
          //console.log("been here inside for loop")
          if (effect.value && effect.value.id && effect.value.from !== undefined && effect.value.id !== id ) {
            //console.log("Cursor bonk:")
            const cursor = {
              id: effect.value.id,
              from: effect.value.from,
              to: effect.value.to
            }
            if (u.caret){
              effects.push(addCursor.of(cursor))
            }
            else {
              effects.push(deleteCursor.of(cursor))
            }
          }
        })
        return {
          changes: ChangeSet.fromJSON(u.changes),
          clientID: u.clientID,
          effects
        }
      }
      return {
        changes: ChangeSet.fromJSON(u.changes),
        clientID: u.clientID
      }
    })
  )
}

export function getDocument(socket, roomId) {
  return new Promise(function(resolve) {
    socket.emit("getDocument", roomId)
    //console.log("trying")

    socket.once("getDocumentResponse", function(version, doc) {
      //console.log("got!")
      resolve({
        version,
        doc: Text.of(doc.split("\n"))
      })
    })
  })
}

export const peerExtension = (socket, startVersion, roomId, id) => {
  const plugin = ViewPlugin.fromClass(
    class {
      pushing = false
      done = false
      view = null
      id = 0

      constructor(view) {
        this.view = view
        this.pull()
        this.id = id
      }


      update(update) {
        //console.log(update)
        if (update.docChanged || update.transactions.length) 
        {
          //console.log("updated")
          this.push()
        }
      }

      async push() {
        const updates = sendableUpdates(this.view.state)
        //console.log(updates)
        if (this.pushing || !updates.length) {
          //console.log("push failed")
          return
        }
        this.pushing = true
        const version = getSyncedVersion(this.view.state)
        //console.log(version)
        await pushUpdates(socket, version, updates, roomId)
        this.pushing = false
        // Regardless of whether the push failed or new updates came in
        // while it was running, try again if there's updates remaining
        //console.log(sendableUpdates(this.view.state))
        if (sendableUpdates(this.view.state).length){
          
          setTimeout(() => this.push(), 100)
        }
      }

      async pull() {
        while (!this.done) {
          const version = getSyncedVersion(this.view.state)
          const updates = await pullUpdates(socket, version, roomId, this.id)
          //console.log(version)
          //console.log(updates)
          let updatesCopy = []

          let effectsCopy = []
          updates.map(u=>{
            if (u.effects){
              u.effects.map(e => {
                if ( e.value && e.value.id !== id && e.value.from !== undefined && e.value.to !== undefined) {
                  if (e.is(addCursor)){
                    effectsCopy.push(
                      remoteCursor.of({
                        id: e.value.id,
                        from: e.value.from,
                        to: e.value.to,
                      })
                    )
                  }
                  else{
                    effectsCopy.push(deleteCursor.of({
                      id: e.value.id,
                      from: e.value.from,
                      to: e.value.to,
                    }))
                  }
                }
                
              })
            }
            
            updatesCopy.push({
              changes: u.changes,
              clientID: u.clientID,
              effects: effectsCopy,
            })
          })
          this.view.dispatch(receiveUpdates(this.view.state, updatesCopy))
        }
      }

      destroy() {
        this.done = true
      }
    }
  )

  return [
    collab(
      { 
        startVersion,
        sharedEffects: tr => {
          let effects = []
          tr.effects.forEach(e => {
            if (e.is(addCursor)){
              effects.push(e)
            }
            
            if (e.is(showCaretEffect)){
              console.log(tr.startState.selection.ranges[0])
              effects.push(
                showCaretEffect.of({
                  id: id, 
                  show: e.value.show,
                  from: tr.startState.selection.ranges[0].from,
                  to: tr.startState.selection.ranges[0].to,
                })
              )
            }
            
          })
          /*
					const effects = tr.effects.filter(e => {
						return e.is(addCursor) 
					})
          */
         //console.log(effects)

					return effects;
				}
      }
    ), 
    plugin
  ]
}
