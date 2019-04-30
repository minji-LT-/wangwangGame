cc.Class({
    extends: cc.Component,

    properties: {
        popLayout: cc.Prefab,
        selectBtn: cc.Prefab,
        resultInstance: cc.Prefab,
        difficultLayer: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {        
        this.contentLayout = this.node.getChildByName("ContentLayout");
        var selectBtn = cc.instantiate(this.selectBtn);
        selectBtn.parent = cc.director.getScene();        
        this.difficultLayer.active = false
        this.cells = [];
        this.picTexture = null;

        for (var i = 0; i < this.difficultLayer.children.length; ++i) {
            this.difficultLayer.children[i].on("click", function(event) {
                this.difficultClicked(event.node);
            }, this); 
        }

        cc.loader.loadRes("picture", function(err, texture) {
            if (!err) {
                this.picTexture = texture;
                this.difficultLayer.active = true;
                this.difficultClicked(this.difficultLayer.children[0]);                
            }
            
        }.bind(this));            
         
    },
    difficultClicked: function(btnNode) {
        var labelNode = cc.find("Background/Label", btnNode);
        var strTb = labelNode.getComponent(cc.Label).string.split("x");
        this.matrix_x = Number(strTb[0]);
        this.matrix_y = Number(strTb[1]);

        for (var i = 0; i < this.difficultLayer.children.length; ++i) {
            this.difficultLayer.children[i].getComponent(cc.Button).interactable = btnNode != this.difficultLayer.children[i];     
        }
        this.init();
    },

    init: function() {
        for (var i = 0; i < this.cells.length; ++i) {
            this.cells[i].removeFromParent();
        }
        this.cells = [];
        this.contentLayout.width = Math.min(this.picTexture.width, cc.winSize.width);
        this.contentLayout.height = Math.min(this.picTexture.height, cc.winSize.height - 400);
        var perSize = cc.size(this.contentLayout.width / this.matrix_y, this.contentLayout.height / this.matrix_x);
        for (var i = 0; i < this.matrix_x; ++i) {
            for (var j = 0; j < this.matrix_y; ++j) {
                this.initCell(i, j);                          
            }          
        }
        
        var lines = [];
        for (var i = 1; i < this.matrix_x; ++i) {
            lines.push([cc.v2(-this.contentLayout.width * 0.5, i * perSize.height - this.contentLayout.height * 0.5), 
                cc.v2(this.contentLayout.width * 0.5, i * perSize.height - this.contentLayout.height * 0.5)]);           
        } 

        for (var i = 1; i < this.matrix_y; ++i) {
            lines.push([cc.v2(i * perSize.width -  this.contentLayout.width * 0.5, this.contentLayout.height * 0.5), 
                cc.v2(i * perSize.width - this.contentLayout.width * 0.5, -this.contentLayout.height * 0.5)]);
        }  
        this.drawLines(lines)

        this.setLastActive(false);
        this.shuffle();  
    },

    initCell: function(row, column) {
        var node = new cc.Node();
        var sp = node.addComponent(cc.Sprite);
        node.width = this.contentLayout.width / this.matrix_y;
        node.height = this.contentLayout.height / this.matrix_x;
        var rect = cc.rect(column * node.width, row * node.height, node.width, node.height);
        sp.spriteFrame = new cc.SpriteFrame(this.picTexture, rect);
        node.setAnchorPoint(0, 1);
        node.index = this.cells.length
        this.cells.push(node)
        node.setPosition(node.width * column - this.contentLayout.width * 0.5, this.contentLayout.height * 0.5 - row * node.height);
        node.parent = this.contentLayout;


        node.on(cc.Node.EventType.TOUCH_END, function(event) {
            var target = this.getMoveTarget(node);
            if (target) {
                this.change(node, target);
                if (this.isOver()) {
                    this.cells[this.cells.length - 1].active = true;
                }
            }
        }, this);
    },
    shuffle: function() {

        var move_step = Math.floor(Math.random() * 100 + 50);
        var emptyNode = this.cells[this.cells.length - 1];
        for (var i = 0; i < move_step; ++i) {
            this.change(emptyNode, this.getMoveTarget(emptyNode, true));
        } 
    },
    drawLines: function(lines) {
        var graphicsNode = this.contentLayout.getChildByName("graphics_lines");
        if (!graphicsNode) {
            graphicsNode = new cc.Node();
            graphicsNode.name = "graphics_lines";
            var g = graphicsNode.addComponent(cc.Graphics);

            g.lineWidth = 2;
            g.strokeColor.fromHEX('#eeeeee');            
           
            this.contentLayout.addChild(graphicsNode, 1);
        }
        var g = graphicsNode.getComponent(cc.Graphics);
        g.clear();
        for (var i = 0; i < lines.length; ++i) {
            g.moveTo(lines[i][0].x, lines[i][0].y);
            g.lineTo(lines[i][1].x, lines[i][1].y);
        }
        g.stroke();
    },
    setLastActive: function(b) {
        if (this.cells.length > 0) {
            this.cells[this.cells.length - 1].active = b;
        }
    },
    getMoveTarget: function(node, as_shuffle) {
        var index = -1;
        for (var i = 0; i < this.cells.length; ++i) {
            if (node == this.cells[i]) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            var nodes = [];

            if (index % this.matrix_y != 0) {
                // 不是最左边
                nodes.push(this.cells[index - 1]);                
            }
            if (index % this.matrix_y != this.matrix_y - 1) {
                // 不是最右边
                nodes.push(this.cells[index + 1]);
            }

            if (index >= this.matrix_y) {
                // 不是最上边
                nodes.push(this.cells[index - this.matrix_y]);
            }
            if (index < this.matrix_y * (this.matrix_x - 1)) {
                // 不是最下边
                nodes.push(this.cells[index + this.matrix_y])
            }

            if (as_shuffle) {
                var random_index = Math.floor(Math.random() * nodes.length);
                return nodes[random_index];
            } else {
                for (var i = 0; i < nodes.length; ++i) {
                    if (!nodes[i].active) {
                        return nodes[i]
                    }
                }
            }
        }
        return null
    },
    change:  function(nodeA, nodeB) {
        var indexA = -1;
        var indexB = -1;
        for (var i = 0; i < this.cells.length; ++i) {
            if (nodeA == this.cells[i]) {
                indexA = i;
            }
            if (nodeB == this.cells[i]) {
                indexB = i;
            }
        }
        if (indexA >=0 && indexB >= 0) {
            this.cells[indexA] = nodeB;
            this.cells[indexB] = nodeA;
            var posA = nodeA.getPosition();
            nodeA.setPosition(nodeB.getPosition());
            nodeB.setPosition(posA);
        }
    },
    isOver: function() {
        for (var i = 0; i < this.cells.length; ++i) {
            if (this.cells[i].index != i) {
                return false;
            }
        }
        if (!this.resultPopView) {
            this.resultPopView = cc.instantiate(this.resultInstance);    
            this.resultPopView.parent = cc.director.getScene();            
            this.resultPopView.on(cc.Node.EventType.TOUCH_END, function(event) {
                event.target.active = false;
            }, this);
        }
        this.resultPopView.active = true;
        this.resultPopView.children[0].getChildByName("ScoreLabel").getComponent(cc.Label).string = "";
        return true;
    },
    viewClick: function(event) {
        var popPic = cc.director.getScene().getChildByName("pop_pic_name");
        if (!popPic) {
            popPic = cc.instantiate(this.popLayout);    
            var node = new cc.Node();
            var sp = node.addComponent(cc.Sprite);

            sp.spriteFrame = new cc.SpriteFrame(this.picTexture) 
            node.parent = popPic;

            popPic.name = "pop_pic_name";
            popPic.setPosition(cc.winSize.width * 0.5, cc.winSize.height * 0.5);
            
            popPic.parent = cc.director.getScene();            
            popPic.on(cc.Node.EventType.TOUCH_END, function(event) {
                event.target.active = false;
            }, this);
        }
        popPic.active = true;
    },
   
});
