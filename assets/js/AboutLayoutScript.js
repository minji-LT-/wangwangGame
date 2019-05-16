cc.Class({
    extends: cc.Component,

    properties: {
        label: cc.Label,
        content: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.node.on(cc.Node.EventType.TOUCH_END, function(event) {
            var touches = event.getTouches();
            var touchLoc = touches[0].getLocation();
            touchLoc = this.content.convertToNodeSpace(touchLoc);
            if (!cc.rect(0, 0, this.content.width, this.content.height).contains(touchLoc)) {
                this.node.active = false;
            }
        }, this);
    },

    start () {

    },

    // update (dt) {},
});
