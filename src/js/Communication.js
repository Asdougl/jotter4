/*  Communication Class
===============================

controls communications between controller classes

*/
module.exports = class Communication {

    static events = [];

    constructor() {
        this.events = [];
    }

    // AKA Listener, 
    static register(name, callback) {
        // Ensure Uniqueness
        if(this.events.find(e => e.name == name)) {
            throw new Error(`Event name of ${name} is not unique`);
        } else {
            this.events.push({ name, callback });
        }
    }

    // When you want the event to occur
    static do(name, params) {
        const event = this.events.find(e => e.name == name);
        if(!event) throw new Error(`Event ${name} does not exist`);
        
        if(params) {
            return event.callback(...params);
        } else {
            return event.callback();
        }
        
    }

    static cleanup(name) {
        const evtIndex = this.events.findIndex(e => e.name == name);
        if (evtIndex == -1) throw new Error(`Event ${name} does not exist`);

        this.events.splice(evtIndex, 1);
    }

}