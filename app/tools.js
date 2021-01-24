tools = (function() {
    function createDialogue(title, msg, actions) {
        actions = actions || {ok: () => {}}
        let el = document.createElement("div")
        el.className = "dialogue"

        let cover_el = document.createElement("div")
        cover_el.className = "dialogue-cover"
        
        let title_el = document.createElement("div")
        title_el.className = "title"
        title_el.textContent = title
        
        let msg_el = document.createElement("div")
        msg_el.className = "msg" 
        msg_el.textContent = msg
        
        el.append(title_el, msg_el)

        Object.keys(actions).forEach(key => {
            let button_el = document.createElement("button")
            button_el.className = "action"
            button_el.addEventListener("click", () => {
                actions[key]()
                cover_el.remove()
            })
            button_el.textContent = key
            el.append(button_el)
        })
        
        cover_el.append(el)

        document.body.append(cover_el)
    }

    return {
        createDialogue
    }
})()