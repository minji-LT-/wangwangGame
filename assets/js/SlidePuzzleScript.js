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
        this.hiddenCell = null;

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

        var selectCell = null;
        var move_dir = 0; // 1 up  2 down  3 left 4 right
        var pre_pos = cc.v2(0, 0);

        var doResult = function() {
            if (selectCell) {
                var can_change = false;
                if (move_dir == 3 || move_dir == 4) {
                    if (Math.abs(pre_pos.x - selectCell.x) > selectCell.width * 0.5) {
                        can_change = true;
                    }
                } else if (move_dir == 1 || move_dir == 2) {
                    if (Math.abs(pre_pos.y - selectCell.y) > selectCell.height * 0.5) {
                        can_change = true;
                    }
                }
                if (can_change) {
                    this.change(this.hiddenCell, selectCell, pre_pos);
                    if (this.isOver()) {
                        this.setLastActive(true);
                    }
                } else {
                    selectCell.setPosition(pre_pos);
                }
            }
            selectCell = null;
        };
        this.contentLayout.on(cc.Node.EventType.TOUCH_START, function(event) {
            if (this.hiddenCell && this.hiddenCell.active) {
                return;
            }
            var touches = event.getTouches();
            var touchLoc = touches[0].getLocation();
            selectCell = null;
            move_dir = 0;
            for (var i = 0; i < this.cells.length; ++i) {
                var tempPos = this.cells[i].convertToNodeSpace(touchLoc);
                if (cc.rect(0, 0, this.cells[i].width, this.cells[i].height).contains(tempPos)) {
                    selectCell = this.cells[i];
                    break;
                }
            }

            if (selectCell) {
                if (selectCell == this.hiddenCell) {
                    selectCell = null;
                } else {
                    var row_num1 = this.getRowNum(selectCell);
                    var row_num2 = this.getRowNum(this.hiddenCell);
                    var column_num1 = this.getColumn(selectCell);
                    var column_num2 = this.getColumn(this.hiddenCell);
                    if (row_num1 == row_num2) {
                        if (column_num1 > column_num2) {
                            move_dir = 3;
                        } else {
                            move_dir = 4;
                        }
                    } else if (column_num1 == column_num2) {
                        if (row_num1 > row_num2) {
                            move_dir = 2;
                        } else {
                            move_dir = 1;
                        }

                    } else {
                        selectCell = null;
                    }
                }
            }
            if (selectCell) {
                pre_pos = selectCell.getPosition();
            }
        }, this);
        this.contentLayout.on(cc.Node.EventType.TOUCH_MOVE, function(event) {
            var touches = event.getTouches();
            var touchLoc = touches[0].getLocation();
            touchLoc = this.contentLayout.convertToNodeSpace(touchLoc);
            var d = touches[0].getDelta();
            if (selectCell) {
                if (move_dir == 1 || move_dir == 2) {
                    selectCell.y += d.y;
                    if (this.isBoundary(selectCell, d.y > 0 && 1 || 2)) {
                        selectCell.y -= d.y;
                    }
                } else if (move_dir == 3 || move_dir == 4) {
                    selectCell.x += d.x;
                    if (this.isBoundary(selectCell, d.x > 0 && 4 || 3)) {
                        selectCell.x -= d.x;
                    }
                }
            }

        }, this);      
        this.contentLayout.on(cc.Node.EventType.TOUCH_END, function(event) {
            doResult.apply(this);
        }, this);
        this.contentLayout.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
            doResult.apply(this);
        }, this);
         
    },
    isBoundary: function(cell, dir) {
        var index =  this.getIndexInCells(cell);
        if (dir == 3) {
            var leftCell = this.cells[index - 1];
            if (!leftCell) {
                return true;
            } else if (this.getRowNum(cell) != this.getRowNum(leftCell)) {
                return true;
            } else if (this.hiddenCell == leftCell) {
                if (cell.x <= leftCell.x) {
                    return true;
                }
            } else if (leftCell.x + leftCell.width >= cell.x) {
                return true;
            }
        } else if (dir == 4) {
            var rightCell = this.cells[index + 1];
            if (!rightCell) {
                return true;
            } else if (this.getRowNum(cell) != this.getRowNum(rightCell)) {
                return true;
            } else if (this.hiddenCell == rightCell) {
                if (cell.x >= rightCell.x) {
                    return true;
                }
            } else if (cell.x + cell.width >= rightCell.x) {
                return true;
            }
        } else if (dir == 1) {
            var upCell = this.cells[index - this.matrix_y];
            if (!upCell) {
                return true;
            } else if (this.hiddenCell == upCell) {
                if (cell.y >= upCell.y) {
                    return true;
                }
            } else if (cell.y + cell.height >= upCell.y) {
                return true;
            }
        } else if (dir == 2) {
            var  downCell = this.cells[index + this.matrix_y];
            if (!downCell) {
                return true;
            } else if (this.hiddenCell == downCell) {
                if (cell.y <= downCell.y) {
                    return true;
                }
            } else if (downCell.y + downCell.height >= cell.y) {
                return true;
            }
        }
        return false;
    },
    getRowNum: function(cell) {
        var index = this.getIndexInCells(cell);
        if (index >= 0) {
            return Math.floor(index / this.matrix_y);
        } else {
            return -1;
        }
    },
    getColumn: function(cell) {
        var index = this.getIndexInCells(cell);
        if (index >= 0) {
            return index % this.matrix_y;
        } else {
            return -1;
        }
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
        this.hiddenCell = this.cells[this.cells.length - 1];

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
    },

    shuffle: function() {

        var move_step = Math.floor(Math.random() * 100 + 50);
        for (var i = 0; i < move_step; ++i) {
            this.change(this.hiddenCell, this.getMoveTarget(this.hiddenCell, true));
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
        if (this.hiddenCell) {
            this.hiddenCell.active = b;
        }
    },
    getIndexInCells: function(cell) {
        var index = -1;
        for (var i = 0; i < this.cells.length; ++i) {
            if (cell == this.cells[i]) {
                index = i;
                break;
            }
        }
        return index;
    },
    getMoveTarget: function(node, as_shuffle) {
        var index = this.getIndexInCells(node);

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
    change:  function(nodeA, nodeB, assign_pos_a) {
        var indexA = this.getIndexInCells(nodeA);
        var indexB = this.getIndexInCells(nodeB);
        if (indexA >=0 && indexB >= 0) {
            this.cells[indexA] = nodeB;
            this.cells[indexB] = nodeA;
            var posA = nodeA.getPosition();
            nodeA.setPosition(assign_pos_a && assign_pos_a || nodeB.getPosition());
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
