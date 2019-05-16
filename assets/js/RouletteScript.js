const e_color = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "00ffff", "#ffffff", "#000000", ];
cc.Class({
    extends: cc.Component,

    properties: {
        contentGraphics: cc.Graphics,
        needleGraphics: cc.Graphics,
        editBox: cc.EditBox,
        aboutLayer: cc.Prefab,
        selectBtn: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        var selectBtn = cc.instantiate(this.selectBtn);
        selectBtn.parent = cc.director.getScene();   

        this.radius = (cc.winSize.width - 80) * 0.5;
        this.contentGraphics.node.width = this.contentGraphics.node.height = this.radius * 2;
        this.contentGraphics.clear();
        this.contentGraphics.lineWidth = 5;
        this.contentGraphics.fillColor.fromHEX("#eeeeee");
        this.contentGraphics.circle(0, 0, this.radius);
        this.contentGraphics.fill();

        var str = cc.sys.localStorage.getItem("roulette_words");
        if (!str) {
            str = this.editBox.string;
        }
        this.drawArc(str);

        this.drawNeedle();
        
        this.initTouchEvent();  
    },

    initTouchEvent: function() {
        this.inertia = 0;
        this.is_touch = false;
        this.clock = 0;
        this.duration = 0;
        this.contentGraphics.node.on(cc.Node.EventType.TOUCH_START, function(event) {
            this.inertia = 0;
            this.is_touch = true;
            this.clock = 0;
            this.duration = 0;   
        }, this);
        this.contentGraphics.node.on(cc.Node.EventType.TOUCH_MOVE, function(event) {
            var touches = event.getTouches();
            var d = touches[0].getDelta();
            var distance = 0;
            var pre_pos = touches[0].getPreviousLocation();
            // console.log(pre_pos);
            if (Math.abs(d.x) >= Math.abs(d.y)) {
                distance = d.x;
                if (pre_pos.y < this.contentGraphics.node.convertToWorldSpace(0, 0).y) {
                    distance = -d.x;
                }
            } else {
                distance = -d.y;
                if (pre_pos.x < this.contentGraphics.node.convertToWorldSpace(0, 0).x) {
                    distance = d.y;
                }
            }
            this.contentGraphics.node.rotation += distance * 0.5;
            this.inertia = distance;
        }, this);
        this.contentGraphics.node.on(cc.Node.EventType.TOUCH_END, function(event) {
            this.is_touch = false;
            this.duration = Math.min(Math.abs(this.inertia) * 0.06, 3);
        }, this);
        this.contentGraphics.node.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
            this.is_touch = false;
            this.duration = Math.min(Math.abs(this.inertia) * 0.06, 3);
        }, this);
    },

    drawNeedle: function() {
        this.needleGraphics.clear()
        this.needleGraphics.fillColor.fromHEX("#3e4e5e");
        this.needleGraphics.moveTo(0, 5);
        this.needleGraphics.lineTo(this.radius - 50, 5);
        this.needleGraphics.lineTo(this.radius - 44, 0);
        this.needleGraphics.lineTo(this.radius - 50, -5);
        this.needleGraphics.lineTo(0, -5);
        this.needleGraphics.fill();

        this.needleGraphics.circle(0, 0, 10);
        this.needleGraphics.fill();
    },

    drawArc: function(str)
    {
        if (this.words == str) {
            return;
        }
        this.words = str;
        var arr = str.split("#");
        

        var num = arr.length;
        this.contentGraphics.node.removeAllChildren();
        for (var i = 0; i < num; ++i) {
            this.contentGraphics.fillColor.fromHEX(e_color[i % e_color.length]);
            this.contentGraphics.arc(0, 0, this.radius - 10, Math.PI * 2 / num * i, Math.PI * 2 / num * (i + 1), true);
            this.contentGraphics.lineTo(0, 0);
            this.contentGraphics.fill();

            var node = new cc.Node();
            var label = node.addComponent(cc.Label);
            label.string = arr[i];
            var p = Math.PI * 2 / num * (i + 0.5);
            node.x = this.radius * 0.5 * Math.cos(p);
            node.y = this.radius * 0.5 * Math.sin(p);
            node.rotation = -p * 180 / Math.PI;
            var labelOutline = node.addComponent(cc.LabelOutline);
            labelOutline.color.fromHEX("#5b290c");
            labelOutline.width = 1;
            node.parent = this.contentGraphics.node;
        }
        
    },
    update (dt) {
        if (!this.is_touch && this.clock < this.duration) {
            this.contentGraphics.node.rotation += this.declineFun(this.clock);
            this.clock += dt;
        }
    },
    onDestroy() {
        cc.sys.localStorage.setItem("roulette_words", this.words);
    },
    declineFun: function(t) {
        return this.inertia - this.inertia / this.duration * t
    },
    okBtnTouched: function(event) {
        var str = this.editBox.string;
        this.drawArc(str);
    },
    aboutTouched: function(event) {
        if (!this.popView) {
            this.popView = cc.instantiate(this.aboutLayer);    
            this.popView.parent = cc.director.getScene();    

            this.popView.getComponent("AboutLayoutScript").label.string = "输入用井号(#)隔开的词组, 然后就转吧, 选择让它来帮你决定!";
        }
        this.popView.active = true;
    },

});
