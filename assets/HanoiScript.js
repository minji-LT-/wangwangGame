
cc.Node._multi_touchable = false;
cc.Node._first_touch_id = null;
var _TempdispatchEvent = cc.Node.prototype.dispatchEvent;
cc.Node.prototype.dispatchEvent = function(event) {
    switch (event.type) {
        case cc.Node.EventType.TOUCH_START:
            if (cc.Node._multi_touchable || cc.Node._first_touch_id === null) {
                this._canTouch = true;
                cc.Node._first_touch_id = event.getID();
                _TempdispatchEvent.call(this, event);
            } 
            break;
        case cc.Node.EventType.TOUCH_MOVE:
            if (this._canTouch && (cc.Node._multi_touchable || event.getID() == cc.Node._first_touch_id)) {
                _TempdispatchEvent.call(this, event);
            }
            break;
        case cc.Node.EventType.TOUCH_END:
            if (this._canTouch && (cc.Node._multi_touchable || event.getID() == cc.Node._first_touch_id)) {
                this._canTouch = false;
                cc.Node._first_touch_id = null;
                _TempdispatchEvent.call(this, event);
            }
            break;
        case cc.Node.EventType.TOUCH_CANCEL:
            if (this._canTouch && (cc.Node._multi_touchable || event.getID() == cc.Node._first_touch_id)) {
                this._canTouch = false;
                cc.Node._first_touch_id = null;
                _TempdispatchEvent.call(this, event);
            }
            break;
        default:
            _TempdispatchEvent.call(this, event);
    }
};
var _tempOnPostActivated = cc.Node.prototype._onPostActivated;
cc.Node.prototype._onPostActivated = function(active) {
    if (!active && this._canTouch) {
        this._canTouch = false;
        cc.Node._first_touch_id = null;
    }
    _tempOnPostActivated.call(this, active);
};

var _tempOnPreDestroy = cc.Node.prototype._onPreDestroy;
cc.Node.prototype._onPreDestroy = function() {
    if (this._canTouch) {
        this._canTouch = false;
        cc.Node._first_touch_id = null;
    }
    _tempOnPreDestroy.call(this);
}
cc.Class({
    extends: cc.Component,

    properties: {
        barBaseNode: cc.Prefab,
        undoBtn: cc.Button,
        stepLabel: cc.Label,
        resultInstance: cc.Prefab,
        aboutInstance: cc.Prefab,
        levelLayout: cc.Layout,
        levelInstance: cc.Prefab,
        selectBtn: cc.Prefab,
        minDiskNum: 3,
        maxDiskNum: 8,
    },


    onLoad () {
        this.historyMoves = [];
        this.stepFormatString = this.stepLabel.string;        

        this.leftBar = cc.instantiate(this.barBaseNode);
        this.leftBar.parent = cc.find("Canvas/Content");

        this.middleBar = cc.instantiate(this.barBaseNode);
        this.middleBar.parent = this.leftBar.parent;

        this.rightBar = cc.instantiate(this.barBaseNode);
        this.rightBar.parent = this.leftBar.parent;
        
        var selectBtn = cc.instantiate(this.selectBtn);
        selectBtn.parent = cc.director.getScene();
        
        var selectedDisk = null;
        var touchStartBarScript = null;
        this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
            var touches = event.getTouches();
            var touchLoc = touches[0].getLocation();
            touchStartBarScript = this.getTouchBar(touchLoc);
            if (touchStartBarScript) {
                selectedDisk = touchStartBarScript.removeDisk();
                selectedDisk.x = touchLoc.x;
                selectedDisk.y = touchLoc.y - selectedDisk.height * 0.5;
                selectedDisk.parent = cc.director.getScene();
            }

        }, this);

        this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            var touches = event.getTouches();
            var touchLoc = touches[0].getLocation();
            if (selectedDisk) {
                var d = touches[0].getDelta();
                selectedDisk.x += d.x;
                selectedDisk.y += d.y;
                if (selectedDisk.x > this.node.width - selectedDisk.width * 0.5) {
                    selectedDisk.x = this.node.width - selectedDisk.width * 0.5;
                }
                if (selectedDisk.x < selectedDisk.width * 0.5) {
                    selectedDisk.x = selectedDisk.width * 0.5;
                }

                if (selectedDisk.y > this.node.height - selectedDisk.height) {
                    selectedDisk.y = this.node.height - selectedDisk.height;
                }
                if (selectedDisk.y < 0) {
                    selectedDisk.y = 0;
                }                
            }
        }, this);

        this.node.on(cc.Node.EventType.TOUCH_END, function (event) {
            var touches = event.getTouches();
            var touchLoc = touches[0].getLocation();
            if (selectedDisk) {
                var touchEndBarScript = this.getTouchBar(touchLoc, true);
                if (touchEndBarScript && touchEndBarScript != touchStartBarScript && touchEndBarScript.canAddDisk(selectedDisk)) {
                    this.addStep();
                    touchEndBarScript.addDisk(selectedDisk);
                    this.historyMoves.push({from: touchStartBarScript, to: touchEndBarScript});
                    this.undoBtn.interactable = true;                    
                } else {
                    touchStartBarScript.addDisk(selectedDisk);
                }
            }
            touchStartBarScript = null;
            selectedDisk = null;
        }, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
            if (selectedDisk) {
                touchStartBarScript.addDisk(selectedDisk);
            }
            touchStartBarScript = null;
            selectedDisk = null;
        }, this);

        cc.director.getScene().on("SUCCESS_EVT", function(event) {
            if (!this.resultPopView) {
                this.resultPopView = cc.instantiate(this.resultInstance);    
                this.resultPopView.parent = cc.director.getScene();            
                this.resultPopView.on(cc.Node.EventType.TOUCH_END, function(event) {
                    event.target.active = false;
                    this.setDiskNum();
                }, this);
            }
            this.resultPopView.active = true;
            this.resultPopView.children[0].getChildByName("ScoreLabel").getComponent(cc.Label).string = this.getSomeString();
        }, this);

        
        for (var i = this.minDiskNum; i <= this.maxDiskNum; ++i) {
            var levelBtn = cc.instantiate(this.levelInstance);
            levelBtn.index = i;
            var label = levelBtn.getComponentInChildren(cc.Label);
            label.string = i;
            levelBtn.parent = this.levelLayout.node;
            levelBtn.on("click", this.levelBtnTouched, this);
        }
       this.levelBtnTouched(this.levelLayout.node.children[0].getComponent(cc.Button));
    },

    start () {

    },
    setDiskNum: function(diskNum) {
        this.diskNum = diskNum || this.diskNum;
        this.diskNum = Math.max(2, this.diskNum);
        

        this.leftBar.getComponent("BarBaseScript").initNum(this.diskNum);
        this.middleBar.getComponent("BarBaseScript").initByNode(this.leftBar);
        this.rightBar.getComponent("BarBaseScript").initByNode(this.leftBar);
        this.rightBar.getComponent("BarBaseScript").addSuccessListener(this.diskNum);

        this.undoBtn.interactable = false;
        this.stepCount = 0;
        this.stepLabel.string = this.stepFormatString.replace(/%s/, this.stepCount);

        this.historyMoves = [];
    },
    getTouchBar: function(touchLoc, isTouchEnd) {
        var tempArr = [this.leftBar, this.middleBar, this.rightBar];
        for (let i = 0; i < tempArr.length; ++i) {
            if (tempArr[i].getComponent("BarBaseScript").isTouchIn(touchLoc, isTouchEnd)) {
                return tempArr[i].getComponent("BarBaseScript");
            }
        }
        return null;
    },
    move: function(fromBar, toBar) {
        var disk = fromBar.removeDisk();
        toBar.addDisk(disk);
        this.addStep();
    },

    onNewBtnTouched: function(event) {
        this.setDiskNum();
    },
    onUndoBtnTouched: function(event) {
        if (this.historyMoves.length > 0) {
            var o = this.historyMoves.pop()
            this.move(o.to, o.from);
            if (this.historyMoves.length == 0) {
                event.target.getComponent(cc.Button).interactable = false;
            }
        }
    },
    aboutBtnTouched: function(event) {
        if (!this.aboutPopView) {
            this.aboutPopView = cc.instantiate(this.aboutInstance);
            this.aboutPopView.parent = cc.director.getScene();
            this.aboutPopView.on(cc.Node.EventType.TOUCH_END, function(event) {
                event.target.active = false;
            }, this);
        }
        this.aboutPopView.active = true;
    },

    levelBtnTouched: function(sender) {
        this.setDiskNum(sender.node.index);
        var nodes = this.levelLayout.node.children;
        for (var i = 0; i < nodes.length; ++i) {
            nodes[i].getComponent(cc.Button).interactable = sender.node != nodes[i];            
        }          
    },

    addStep: function() {
        this.stepLabel.string = this.stepFormatString.replace(/%s/, ++this.stepCount);
    },
    
    getSomeString: function() {
        // var count = 0;
        // var tempFun = function(n, A, B, C) {
        //     if (n == 1) {
        //         count++;
        //         return;
        //     }
        //     tempFun(n - 1, A, C, B);
        //     tempFun(1, A, B, C);
        //     tempFun(n - 1, B, A, C);            
        // }
        // tempFun(this.diskNum, "a", "b", "c");
        var str = ""
        var best = Math.pow(2, this.diskNum) - 1;
        var rate = Math.ceil(best / this.stepCount * 100) ;
        if (rate == 100) {
            str = "大神, 膜拜呀";
        } else if(rate >= 90) {
            str = "非常棒!";
        } else if (rate >= 80) {
            str = "很好啊!";
        } else if (rate >= 60) {
            str = "不错哟!";
        } else if (rate >= 40) {
            str = "一般般了, 继续努力!";
        } else {
            str = "加油! 还有很大空间提升噢";
        }
        return str;
    }
});
