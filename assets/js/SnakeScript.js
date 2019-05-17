cc.Class({
    extends: cc.Component,

    properties: {
        contentGraphics: cc.Graphics,
        snakeCell: cc.Prefab,
        scoreLabel: cc.Label,
        aboutLayer: cc.Prefab,
        selectBtn: cc.Prefab,
        pauseBtn: cc.Button,
    },


    onLoad () {
        var selectBtn = cc.instantiate(this.selectBtn);
        selectBtn.parent = cc.director.getScene();  
        this.time = 0;
        this.delta_time = 0.5;
        this.dead = false;
        this.pause = true;

        this.cell_w = 50;
        this.direction = 2; // 1 left; 2 right; 3 up; 4 down;
        this.row_num = Math.floor(this.contentGraphics.node.height / this.cell_w);
        this.colum_num = Math.floor(this.contentGraphics.node.width / this.cell_w);

        this.contentGraphics.clear();
        this.contentGraphics.rect(-this.contentGraphics.node.width * 0.5, -this.contentGraphics.node.height * 0.5, 
                this.contentGraphics.node.width, this.contentGraphics.node.height);
        this.contentGraphics.fill();

        for (var i = 0; i <= this.row_num; ++i) {
            this.contentGraphics.moveTo(-this.contentGraphics.node.width * 0.5, -this.contentGraphics.node.height * 0.5 + this.cell_w * i);
            this.contentGraphics.lineTo(this.colum_num * this.cell_w - this.contentGraphics.node.width * 0.5, -this.contentGraphics.node.height * 0.5 + this.cell_w * i);
        }
        for (var i = 0; i <= this.colum_num; ++i) {
            this.contentGraphics.moveTo(-this.contentGraphics.node.width * 0.5 + i * this.cell_w, -this.contentGraphics.node.height * 0.5);
            this.contentGraphics.lineTo(-this.contentGraphics.node.width * 0.5 + i * this.cell_w, this.row_num * this.cell_w - this.contentGraphics.node.height * 0.5);
        }
        this.contentGraphics.stroke();


        this.allPositions = []
        for (var i = 0; i < this.row_num; ++i) {
            for (var j = 0; j < this.colum_num; ++j) {
                this.allPositions.push(cc.v2(-this.contentGraphics.node.width * 0.5 + j * this.cell_w, -this.contentGraphics.node.height * 0.5 + i * this.cell_w));
            }
        }

        var touchStart_pos;
        this.contentGraphics.node.on(cc.Node.EventType.TOUCH_START, function(event) {
            touchStart_pos = event.getTouches()[0].getLocation();
        }, this);
           
        this.contentGraphics.node.on(cc.Node.EventType.TOUCH_END, function(event) {
            var end_pos = event.getTouches()[0].getLocation();
            var delta_pos = cc.v2(end_pos.x - touchStart_pos.x, end_pos.y - touchStart_pos.y);
            if (Math.sqrt(delta_pos.x * delta_pos.x + delta_pos.y * delta_pos.y) >= 10) {
                if (Math.abs(delta_pos.x) > Math.abs(delta_pos.y)) {
                    if (this.direction == 3 || this.direction == 4) {
                        if (delta_pos.x > 0) {
                            this.direction = 2;
                        } else {
                            this.direction = 1;
                        }
                    }
                } else {
                    if (this.direction == 1 || this.direction == 2) {
                        if (delta_pos.y > 0) {
                            this.direction = 3;
                        } else {
                            this.direction = 4;
                        }
                    }
                }
            }
        }, this);
        this.contentGraphics.node.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
            var end_pos = event.getTouches()[0].getLocation();
            var delta_pos = cc.v2(end_pos.x - touchStart_pos.x, end_pos.y - touchStart_pos.y);
            if (Math.sqrt(delta_pos.x * delta_pos.x + delta_pos.y * delta_pos.y) >= 10) {
                if (Math.abs(delta_pos.x) > Math.abs(delta_pos.y)) {
                    if (this.direction == 3 || this.direction == 4) {
                        if (delta_pos.x > 0) {
                            this.direction = 2;
                        } else {
                            this.direction = 1;
                        }
                    }
                } else {
                    if (this.direction == 1 || this.direction == 2) {
                        if (delta_pos.y > 0) {
                            this.direction = 3;
                        } else {
                            this.direction = 4;
                        }
                    }
                }
            }
        }, this);



        this.bodyCells = [];
        this.init_cell_length = 2;
        for (var i = 0; i < this.init_cell_length; i++) {
            this.addCell();
        }
        this.initRun();
        this.generateTarget();
    },

    initRun: function() {
        while (this.bodyCells.length > this.init_cell_length) {
            var node = this.bodyCells.pop();
            node.destroy();
        }
        var random = 0;//Math.floor(Math.random() * this.allPositions.length);
        for (var i = 0; i < this.init_cell_length; ++i) {
            this.bodyCells[i].setPosition(this.allPositions[random + this.init_cell_length - i - 1]);
        }
        this.pause = true;
        this.dead = false;
        this.direction = 2;
    },
    addCell: function() {
        var node = cc.instantiate(this.snakeCell);
        node.width = node.height = this.cell_w;
        node.parent = this.contentGraphics.node;
        node.setAnchorPoint(0, 0);
        this.bodyCells.push(node);

        // var labelNode = new cc.Node();
        // var label = labelNode.addComponent(cc.Label);
        // label.string = this.bodyCells.length;
        // labelNode.parent = node;
    },
    generateTarget: function() {
        if (!this.targetNode) {
            this.targetNode = cc.instantiate(this.snakeCell);            
            this.targetNode.setAnchorPoint(0, 0);
            this.targetNode.width = this.targetNode.height = this.cell_w;
            this.targetNode.parent = this.contentGraphics.node;
            
        }
        var random = Math.floor(Math.random() * this.allPositions.length);
        this.targetNode.setPosition(this.allPositions[random]);
    },
    doForward: function() {
        
        var head_pos;
        
        var index = this.getIndexByPos(this.bodyCells[0].x, this.bodyCells[0].y);
        if (this.direction == 1) {
            // left
            head_pos = this.allPositions[index - 1];
            if (!head_pos || head_pos.x > this.bodyCells[0].x) {
                this.dead = true;
            }
            
        } else if (this.direction == 2) {
            // right
            head_pos = this.allPositions[index + 1];
            if (!head_pos || head_pos.x < this.bodyCells[0].x) {
                this.dead = true;
            }
        } else if (this.direction == 3) {
            // up
            head_pos = this.allPositions[index + this.colum_num];
            if (!head_pos) {
                this.dead = true;
            }

        } else if (this.direction == 4) {
            head_pos = this.allPositions[index - this.colum_num];
            if (!head_pos) {
                this.dead = true;
            }
        }
        if (!this.dead) {
            for (var i = 0; i < this.bodyCells.length; ++i) {
                if (this.bodyCells[i].x == head_pos.x && this.bodyCells[i].y == head_pos.y) {
                    this.dead = true;
                    this.showResult();
                    return;
                }
            }
            if (head_pos.x == this.targetNode.x && head_pos.y == this.targetNode.y) {
                this.addCell();
                this.generateTarget();
                this.updateDeltaTime();
                this.scoreLabel.string = "分数: " + this.bodyCells.length;
            }
            for (var i = this.bodyCells.length - 1; i > 0; --i) {
                this.bodyCells[i].setPosition(this.bodyCells[i - 1].getPosition());
            }
            this.bodyCells[0].setPosition(head_pos);            
        } else {
            this.showResult();
        }
    },
    getIndexByPos: function(pos, pos_y) {
        var x, y;
        if (pos_y !== undefined) {
            x = pos;
            y = pos_y;
        } else {
            x = pos.x;
            y = pos.y;
        }
        var index = -1;
        for (var i = 0; i < this.allPositions.length; ++i) {
            if (this.allPositions[i].x == x && this.allPositions[i].y == y) {
                index = i;
                break;
            }
        }
        return index;
    },

    update (dt) {
        this.time = this.time + dt;
        if (this.time > this.delta_time && !this.dead && !this.pause) {
            this.time = 0;
            this.doForward();
        }
    },
    showResult: function() {
        if (!this.resultView) {
            this.resultView = cc.instantiate(this.aboutLayer);    
            this.resultView.parent = cc.director.getScene();    

            this.resultView.getComponent("AboutLayoutScript").label.string = "结束啦\n" + this.updateDeltaTime();
        }
        this.resultView.active = true;
    },
    updateDeltaTime: function() {
        var best = Math.floor(this.row_num * this.colum_num * 0.3);
        var rate = Math.ceil(this.bodyCells.length * 100 / best) ;
        var str;
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
        this.delta_time = (0.1 - 0.5) / 100 * rate + 0.5;
        return str;
    },
    pauseClicked: function(event) {
        this.pause = !this.pause;
        var str = "";
        if (this.pause) {
            str = "继续";
        } else {
            str = "暂停";
        }
        event.target.getChildByName("Background").getChildByName("Label").getComponent(cc.Label).string = str;
    },
    resetClicked: function(event) {
        this.initRun();
        this.pauseBtn.node.getChildByName("Background").getChildByName("Label").getComponent(cc.Label).string = "开始";
    },
    aboutTouched: function(event) {
        if (!this.popView) {
            this.popView = cc.instantiate(this.aboutLayer);    
            this.popView.parent = cc.director.getScene();    

            this.popView.getComponent("AboutLayoutScript").label.string = "手指上下左右滑动来改变蛇的方向";
        }
        this.popView.active = true;
    },
});
