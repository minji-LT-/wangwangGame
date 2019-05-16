cc.Class({
    extends: cc.Component,

    properties: {
        selectLayout: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

     selectClick: function(event) {
        var selectLayout = cc.instantiate(this.selectLayout);
        selectLayout.setPosition(cc.director.getWinSize().width * 0.5, cc.director.getWinSize().height * 0.5);            
        selectLayout.parent = cc.director.getScene();            
        selectLayout.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.target.active = false;
        }, this);
        var layout = cc.find("Sprite/Layout", selectLayout);
        layout.getChildren().forEach(function(btn) {
            btn.getComponent(cc.Button).interactable = btn.name + "Scene" != cc.director.getScene().name;        
            btn.on("click", function(event) {
                cc.director.loadScene(btn.name + "Scene");
            });
        }, this);
    },
});
