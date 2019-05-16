// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        diskNode: cc.Prefab,
    },
    
    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.wrapNode = this.node.getChildByName("WrapNode");
        this.bar = this.wrapNode.getChildByName("BarNode");
        this.preHeight = this.bar.height;

        this.base = this.wrapNode.getChildByName("BaseNode");
        this.preWidth = this.base.width;

        this.diskHeight = 40;
        this.disks = [];
    },

    start () {

    },

    // update (dt) {},
    initNum: function(num) {
        for (let i = 0; i < this.disks.length; ++i) {
            this.disks[i].destroy();
        }
        this.disks = [];

        var minRadiu = 60;
        var addRadiuPer = 1.12;
        if (num >= 8) {
            addRadiuPer = 1.06;
        } else if (num >= 6) {
            addRadiuPer = 1.08;
        
        }
        var h = this.diskHeight * num + 40;
        var w = minRadiu * Math.pow(addRadiuPer, num - 1) * 2 + 20;

        this.bar.height = Math.max(h, this.preHeight);
        this.base.width = Math.max(w, this.preWidth);

        for (let i = 0; i < num; ++i) {
            let disk = cc.instantiate(this.diskNode);
            disk.width = minRadiu * Math.pow(addRadiuPer, num - i - 1) * 2;  
            disk.index = i;          
            if (disk.index % 2) {
                disk.bindColor = cc.color(0xff, 0xff, 0);
            } else {
                disk.bindColor = cc.color(0xff, 0xff, 0xff);
            }
            this.addDisk(disk);
        }
        this.wrapNode.width = this.disks[0].width;
        this.wrapNode.height = this.diskHeight * this.disks.length;
    },
    initByNode: function(node) {
        for (let i = 0; i < this.disks.length; ++i) {
            this.disks[i].destroy();
        }
        this.disks = [];
        var nodeScript = node.getComponent("BarBaseScript");

        this.bar.height = nodeScript.bar.height;
        this.base.width = nodeScript.base.width;
        this.wrapNode.width = nodeScript.wrapNode.width;
        this.wrapNode.height = nodeScript.wrapNode.height;
    },

    isTouchIn: function(touchLoc, isTouchEnd) {
        var pos = this.wrapNode.convertToNodeSpace(touchLoc);
        var h = this.wrapNode.height;
        if (isTouchEnd) {
            h = this.bar.height;
        }
        if (cc.rect(0, 30, this.wrapNode.width, h).contains(pos)) {
            return true;
        }
        return false;
    },
    addDisk: function(disk) {
        disk.anchorY = 0;
        disk.y = this.diskHeight * this.disks.length;
        disk.color = disk.bindColor;
        disk.x = 0;
        disk.parent = this.bar;
        this.disks.push(disk);
        this.wrapNode.height = this.diskHeight * this.disks.length;
        if (this._resultNum && this._resultNum == this.disks.length) {
            cc.director.getScene().emit("SUCCESS_EVT");
        }
    },
    removeDisk: function() {
        var disk = this.disks.pop();
        disk.color = cc.color(0xff, 0, 0);
        disk.removeFromParent(false);
        this.wrapNode.height = this.diskHeight * this.disks.length;
        return disk;
    },
    canAddDisk: function(disk) {
        if (this.disks.length > 0 && disk.index < this.disks[this.disks.length - 1].index) {
            return false;
        }
        return true;
    },
    addSuccessListener: function(num) {
        this._resultNum = num;
    }
});
