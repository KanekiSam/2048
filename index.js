class Game {
  constructor() {
    this.initData();
    this.init();
  }
  initData() {
    this.state = {
      score: 0, // 分数
      life: true, // 游戏生命
      targetNum: 0, // 达到2048的次数
      keyNum: 0, // 达到2048获得钥匙的次数
      cardGroups: [], // 牌组
      systemCards: [], // 系统牌组
      systemCardDom: document.querySelector('.cardWrapper'), // 系统牌组容器
      keyWrapperDom: document.querySelector('.keyWrapper'), // 钥匙库
      mainWrapper: document.querySelector('.main'),
      scoreWrapper: document.querySelector('.score'),
      largeNum: 2048, // 最大卡牌数
      minLen: 0, // [2,4,8]小卡牌数
      maxLen: 0, // [16，32，64]大卡牌数
      curMinPoint: 0, // 小卡牌指针
      curMaxPoint: 0, // 大卡牌指针
      maxGroup: 8, // 卡牌最大堆叠数量
      colorMapper: {
        2: '#65734f',
        4: '#8a3c3c',
        8: '#3e8c65',
        16: '#746351',
        32: '#4f6c74',
        64: '#724f56',
        128: '#407a86',
        256: '#3b818d',
        512: '#407885',
        1024: '#993923',
        2048: '#993923'
      },
      isApp: /mobile/i.test(navigator.userAgent),
    };
  }
  init() {
    this.initLens();
    this.createSystemCard();
    this.bindDropEvent();
    // this.bindCardEvent();
  }
  restartGame() {
    this.initData();
    this.state.scoreWrapper.innerText = 0;
    const cardGroups = document.querySelectorAll('.cardGroup');
    for (let ele of cardGroups) {
      ele.innerHTML = '';
    }
    this.state.keyWrapperDom.innerHTML = '';
    this.state.systemCardDom.innerHTML = '';
    setTimeout(() => {
      this.init();
    }, 500);
  }
  initLens() {
    if (this.state.minLen == 0) {
      this.state.minLen = 6 + Math.floor(Math.random() * 3);
      this.state.maxLen = 3 + Math.floor(Math.random() * 3);
    }
    console.log(this.state.minLen, this.state.maxLen);
  }
  checkLife() {
    let flag = false;
    const cardGroups = document.querySelectorAll('.cardGroup');
    const addNum = this.state.systemCardDom.lastElementChild.innerText;
    for (let ele of cardGroups) {
      if (ele.children.length < this.state.maxGroup) {
        flag = true;
        break;
      } else if (addNum == ele.lastElementChild.innerText) {
        flag = true;
        break;
      }
    }
    if (!flag) {
      this.state.life = false;
    }
  }
  addScore(num) {
    let cardNum = num;
    let score = this.state.score;
    while (cardNum % 2 == 0) {
      score += 1;
      cardNum /= 2;
    }
    this.state.score = score;
    console.log(score);
    this.state.scoreWrapper.innerText = score;
  }
  // 1:小卡牌，2大卡牌
  gernerateCardNum(type = 1) {
    let cardNum;
    if (type == 1) {
      cardNum = 8;
      const num = Math.random();
      if (num <= 0.66) cardNum = 4;
      if (num <= 0.33) cardNum = 2;
    } else if (type == 2) {
      cardNum = 16;
      const num = Math.random();
      if (num <= 0.4) cardNum = 32;
      if (num <= 0.1) cardNum = 64;
    }
    return cardNum;
  }
  createSystemCard() {
    const {
      systemCards,
      systemCardDom,
      minLen,
      maxLen,
      curMinPoint,
      curMaxPoint
    } = this.state;
    while (systemCards.length < 3) {
      console.log(curMinPoint);
      let cardNum;
      if (curMinPoint < minLen) {
        cardNum = this.gernerateCardNum();
        this.state.curMinPoint += 1;
      } else if (curMaxPoint < maxLen) {
        cardNum = this.gernerateCardNum(2);
        this.state.curMaxPoint += 1;
      } else {
        this.state.minLen = 0;
        this.state.maxLen = 0;
        this.state.curMinPoint = 1;
        this.state.curMaxPoint = 0;
        this.initLens();
        cardNum = this.gernerateCardNum();
      }
      systemCards.unshift(cardNum);
      this.drawSysTemCard(cardNum);
    }
    systemCardDom.lastElementChild &&
      (systemCardDom.lastElementChild.draggable = true);
  }
  createCard(num) {
    const { colorMapper } = this.state;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerText = num;
    card.style.setProperty('--color', colorMapper[num])
    card.dataset.id = this.getUniqueKey();
    return card;
  }
  drawSysTemCard(num) {
    const { systemCardDom, isApp } = this.state;
    if (systemCardDom) {
      const card = this.createCard(num);
      this.addCardEvent(card, num);
      systemCardDom.prepend(card);
    }
  }
  addCardEvent(ele, num) {
    const that = this;
    const { isApp } = this.state;
    if (!isApp) {
      ele.ondragstart = function (e) {
        var ev = e || window.event;
        ev.dataTransfer.setData('cardNum', num);
        ev.dataTransfer.setData('cardId', ele.dataset.id);
        setTimeout(() => {
          ele.style.top = '200%';
        }, 100);
      };
      ele.ondragend = function () {
        ele.style.top = 0;
      };
    } else {
      const content = document.querySelector('.content');
      ele.ontouchstart = function (e) {
        const ev = e.targetTouches[0];
        const { clientX, clientY } = ev;
        const { left, top, width, height } = ev.target.getBoundingClientRect();
        const diffX = clientX - left;
        const diffY = clientY - top;
        let target;
        ele.ontouchmove = function (e) {
          e.preventDefault();
          const ele_move = e.targetTouches[0];
          const { clientX: moveX, clientY: moveY } = ele_move;
          target = ele_move.target;
          if (moveX - diffX >= 0 && moveX - diffX + width <= content.clientWidth) {
            ele.style.left = moveX - diffX + 'px';
          }
          if (moveY - diffY >= 0 && moveY - diffY + height < content.clientHeight) {
            ele.style.top = moveY - diffY + 'px';
          }
        }
        ele.ontouchend = function (e) {
          that.checkCardOver(target, '1', () => {
            ele.style.left = left + 'px';
            ele.style.top = top + 'px';
          })
        }
      }
    }
  }
  addKeyeEvent(key) {
    const that = this;
    const { isApp } = this.state;
    if (!isApp) {
      key.ondragstart = function (e) {
        var ev = e || window.event;
        ev.dataTransfer.setData('key', key.dataset.id);
      };
    } else {
      console.log('key');
      const content = document.querySelector('.content');
      key.ontouchstart = function (e) {
        const ev = e.targetTouches[0];
        console.log(ev);
        const { clientX, clientY } = ev;
        const { left, top, width, height } = ev.target.getBoundingClientRect();
        const diffX = clientX - left;
        const diffY = clientY - top;
        let target;
        key.ontouchmove = function (e) {
          e.preventDefault();
          const ele_move = e.targetTouches[0];
          const { clientX: moveX, clientY: moveY } = ele_move;
          target = ele_move.target;
          if (moveX - diffX >= 0 && moveX - diffX + width <= content.clientWidth) {
            key.style.left = moveX - diffX + 'px';
          }
          if (moveY - diffY >= 0 && moveY - diffY + height < content.clientHeight) {
            key.style.top = moveY - diffY + 'px';
          }
        }
        key.ontouchend = function (e) {
          that.checkCardOver(target, '2', () => {
            key.style.left = left + 'px';
            key.style.top = top + 'px';
          })
        }
      }
    }
  }
  checkBorder(ele, target) {
    const { left: x, top: y } = ele.getBoundingClientRect();
    const { left, top, width, height } = target.getBoundingClientRect();
  }
  checkCardOver(dom, type, clb) {
    let flag = false;
    let cur;
    if (dom) {
      const { left: x, top: y, width: w, height: h } = dom.getBoundingClientRect();
      const eles = document.querySelectorAll('.cardGroup');
      eles.forEach(ele => {
        if (ele.children.length > 0 && ele.children.length < this.state.maxGroup) {
          const { left, top, width, height } = ele.lastElementChild.getBoundingClientRect();
          if (y > top && y < top + height) {
            if (x > left && x < left + width) {
              if (!cur || left + width - x > cur.diff) {
                cur = {
                  ele,
                  diff: left + width - x
                }
                flag = true;
              }
            }
            if (x < left && x + w > left) {
              if (!cur || x + w - left > cur.diff) {
                cur = {
                  ele,
                  diff: x + w - left
                }
              }
              flag = true;
            }
          }
        } else if (type == '1') {
          const { left, top, width, height } = ele.getBoundingClientRect();
          if (y > top && y < top + height) {
            if (x > left && x < left + width) {
              if (!cur || left + width - x > cur.diff) {
                cur = {
                  ele,
                  diff: left + width - x
                }
                flag = true;
              }
            }
            if (x < left && x + w > left) {
              if (!cur || x + w - left > cur.diff) {
                cur = {
                  ele,
                  diff: x + w - left
                }
              }
              flag = true;
            }
          }
        }
      })
    }
    if (!flag) {
      clb();
    } else {
      if (type == '1') {
        this.addCardApp({ num: dom.innerText, dom: cur.ele });
      } else {
        this.addCardApp({ key: dom.dataset.id, dom: cur.ele });
      }
    }
  }
  addKey() {
    const { keyWrapperDom } = this.state;
    var key = document.createElement('div');
    key.className = 'key';
    key.innerText = 'key';
    key.draggable = true;
    key.dataset.id = this.getUniqueKey();
    this.addKeyeEvent(key);
    // key.ondragstart = function (e) {
    //   var ev = e || window.event;
    //   ev.dataTransfer.setData('key', key.dataset.id);
    // };
    keyWrapperDom.append(key);
  }
  removeKey(key) {
    const { keyWrapperDom } = this.state;
    keyWrapperDom.querySelector(`.key[data-id='${key}']`).remove();
  }
  playAnimate(action, time = 500) {
    return new Promise((r, j) => {
      setTimeout(() => {
        action();
        r();
      }, time);
    });
  }
  async mergeCard(dom) {
    var cur = dom.children.length - 1;
    var curNum = dom.children[cur].innerText;
    if (cur != 0) {
      var prev = dom.children[cur - 1];
      var prevNum = prev.innerText;
      if (curNum == prevNum) {
        dom.lastElementChild.style.top = '-30%';
        await this.playAnimate(() => {
          dom.lastElementChild.remove();
        });
        prev.innerText = curNum * 2;
        prev.style.setProperty('--color', this.state.colorMapper[curNum * 2]);
        this.addScore(curNum * 2);
        if (curNum * 2 >= this.state.largeNum) {
          console.log(dom.lastElementChild);
          dom.lastElementChild.style.left = `${this.state.mainWrapper.clientWidth / 2 -
            dom.lastElementChild.offsetLeft
            }px`;
          dom.lastElementChild.style.top = `${this.state.mainWrapper.clientHeight - 30
            }px`;
          dom.lastElementChild.innerText = 'key';
          await this.playAnimate(() => {
            dom.lastElementChild.remove();
          });
          this.addKey();
        } else {
          this.mergeCard(dom);
        }
      }
      prev.ondragleave?.();
    }
  }
  getUniqueKey() {
    return new Date().getTime() + '-' + Math.random().toFixed(2);
  }
  addCardApp({ num, dom, key }) {
    const { systemCardDom, systemCards } = this.state;
    if (num) {
      const card = this.createCard(num);
      dom.appendChild(card);
      this.bindDragEnterEvent(card);
      this.mergeCard(dom);
      systemCards.pop();
      systemCardDom.removeChild(systemCardDom.lastElementChild);
      this.createSystemCard();
    }
    if (key) {
      dom.lastElementChild && (dom.lastElementChild.innerText *= 2);
      this.addScore(dom.lastElementChild.innerText);
      this.removeKey(key);
    }
  }
  addCard(ev, dom) {
    const { systemCardDom, systemCards } = this.state;
    var data = ev.dataTransfer.getData('cardNum');
    var cardId = ev.dataTransfer.getData('cardId');
    if (data) {
      const card = this.createCard(data);
      dom.appendChild(card);
      this.bindDragEnterEvent(card);
      this.mergeCard(dom);
      systemCards.pop();
      systemCardDom.removeChild(systemCardDom.lastElementChild);
      this.createSystemCard();
    }
    var key = ev.dataTransfer.getData('key');
    if (key) {
      dom.lastElementChild && (dom.lastElementChild.innerText *= 2);
      this.removeKey(key);
    }
  }

  bindDropEvent() {
    const that = this;
    const main = this.state.mainWrapper;
    main.ondragover = function (e) {
      var ev = e || window.event;
      ev.preventDefault();
      // ev.stopPropagation();
    };
    main.ondrop = function (e) {
      var ev = e || window.event;
      console.log(ev.target);
      if (ev.target.classList.contains('card')) {
        if (
          ev.target.parentNode.children.length < that.state.maxGroup &&
          ev.target.dataset.id ==
          ev.target.parentNode.lastElementChild.dataset.id
        ) {
          that.addCard(ev, ev.target.parentNode);
        }
      } else if (ev.target.classList.contains('cardGroup')) {
        if (ev.target.children.length == 0) {
          that.addCard(ev, ev.target);
        }
      }
    };
  }
  bindDragEnterEvent(ele) {
    ele.ondragover = function () {
      ele.style.borderColor = 'red';
    };
    ele.ondragleave = function () {
      ele.style.borderColor = '';
    };
  }
}
const game = new Game();

function restart() {
  game.restartGame();
}
