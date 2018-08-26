/**
 *  翻页效果 
 */

//书本尺寸
let BOOK_WIDTH;
let BOOK_HEIGHT;

//页面尺寸
let PAGE_WIDTH;
let PAGE_HEIGHT;

//书的顶部与纸张的间距
let PAGE_Y;

//画布大小等于书本大小加上这个padding
const CANVAS_PADDING_HORIZONTAL = 10;
const CANVAS_PADDING_VERTICAL = 20;

// TODO 书的纸张的间距
// const BOOK_PADDING = 0;

//翻页速度 0-1
const FLIP_SPEED = 0.34;

//到达需要翻页时候的速度   px/ms
const FLIP_MOVE_SPEED = 0.5;

// const DRAG_FLIP_SPEED = 1;

//翻页力度系数
const FLIP_STRENGTH = 10;

//拖动的是页面的左边或者右边
const DIRECTION = {
    LEFT: 'left',
    RIGHT: 'right'
}

export default class Pageflip {

    constructor(_opts) {

        let defaultOpts = {
            //画布的DOM
            canvas: null,
            //书本的DOM
            book: null,
            //页面的DOM
            pages: null,
            //单页面/双页面  single/double
            display: 'double'
        }

        let opts = Object.assign(defaultOpts, _opts);

        /**
         * 当前页码
         */
        this._pageIndex = 0;

        /**
         * 画布DOM
         */
        this._canvas = opts.canvas;
        /**
         * 画布的context
         */
        this._context = this._canvas.getContext('2d');

        /**
         * 鼠标在书本的位置
         */
        this._mouse = { x: 0, y: 0 };

        /**
         * flip 对象的数组
         */
        this._flips = [];

        /**
         * 书本DOM
         */
        this._book = opts.book;

        /**
         * 页面DOM的数组
         */
        this._pages = Array.from(opts.pages);

        /**
         * 是否单页面显示
         */
        this._isSingle = opts.display === 'single';


        this._currentDirection;

        this._onFlipComplete = opts.onFlipComplete;

        //开始触摸屏幕的X坐标
        this._startX = 0;

        //开始触摸屏幕的时间
        this._startTime = 0;

        //是否在拖动
        this._touchDragging = false;

        //是否启用翻页
        this._enable = true;

        //初始化
        this._init();
    }

    _render() {
        //重置画布
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        this._flips.forEach((flip) => {
            if (flip.dragging) {
                //target 为当前鼠标的位置 (-1 ~ 1之间)
                flip.target = Math.max(Math.min(this._mouse.x / PAGE_WIDTH, 1), -1);
            }

            //将 progress 增加至 target
            flip.progress += (flip.target - flip.progress) * Math.max(Math.min(FLIP_SPEED, 1), 0);

            //拖动页面中 或者 progress没完成 则渲染
            if (flip.dragging || Math.abs(flip.progress) < 0.997) {
                this._drawFlip(flip);
            }
        })
    }

    /**
     * 绑定事件
     */
    _bindEvent() {
        //触摸移动
        document.addEventListener('touchmove', (e) => this._drapMove(e), false);
        //触摸开始
        document.addEventListener('touchstart', (e) => this._drapDown(e), false);
        //释放触摸
        document.addEventListener('touchend', (e) => this._drapRelease(e), false);
    }

    _bindData() {
        Reflect.defineProperty(this, 'pageIndex', {
            get:()=> {
                return this._pageIndex;
            },
            set:(page)=> {
                try {
                    this._onFlipComplete && this._onFlipComplete.call({}, ...[page + 1,this._pageIndex + 1]);
                } catch (error) {
                    console.log(error);
                }
                this._pageIndex = page;
            }
        }),

        //是否正在拖动
        Reflect.defineProperty(this,'isDragging',{
            get:()=>{
                return this._touchDragging;
            }
        })
    }

    /**
     * 准备拖动
     */
    _drapDown(event) {
        // event.touches && this._drapMove(event);

        // 由于需要要从边缘滑动，所以不判断鼠标是否在页面内
        // if (this._mouse.x <= PAGE_WIDTH) { }

        this._startX = event.touches[0].clientX;
        this._startTime = new Date().getTime();

        //防止选中文字
        // event.preventDefault();
    }

    /**
     * 拖动
     */
    _drapMove(event) {
        let x, y;
        if (event.touches) {
            let touch = event.touches[0];
            x = touch.clientX;
            y = touch.clientY;
        } else {
            x = event.clientX;
            y = event.clientY
        }

        if(!this._enable){
            return;
        }

        if (this._touchDragging) {
            this._setMousePos(x, y);
        } else {
            //设置拖动一点距离后才翻页 20px
            let direction = x - this._startX;
            this._touchDragging = Math.abs(direction) >= 20;

            if (!this._touchDragging) {
                return;
            }

            let flipIndex = this._pageIndex + (direction > 0 ? -1 : 0);
            let flip = this._flips[flipIndex];

            if (!flip) {
                this._drapRelease(event);
                return;
            }

            //在右边最后一页，禁止翻动。
            if (direction < 0 && flipIndex === this._flips.length - 1) {
                this._drapRelease(event);
                return;
            }

            this._currentDirection = direction > 0 ? DIRECTION.LEFT : DIRECTION.RIGHT;
            flip.dragging = true;
        }

    }
    /**
     * 设置鼠标相对纸张位置
     * @param {clientX} x 
     * @param {clientY} y 
     */
    _setMousePos(x, y) {
        // 设置鼠标的位置 下方中点坐标为(0，0)
        // this._mouse.x = event.clientX - this._book.offsetLeft - (BOOK_WIDTH / 2);
        this._mouse.x = x - this._book.offsetLeft;
        this._mouse.y = -y + this._book.offsetTop + BOOK_HEIGHT;
    }

    /**
     * 拖动释放
     */
    _drapRelease(event) {

        // 如果页面在拖动中，翻页到目标
        let flip = this._flips.find(item => item.dragging);
        let direction = null;

        this._touchDragging = false;

        if (!flip) {
            return
        };

        let touches = event.touches[0] || event.changedTouches[0];
        let endX = touches.clientX;
        let endTime = new Date().getTime();

        //滑动速度大的时候翻页
        if (Math.abs((endX - this._startX) / (endTime - this._startTime)) > FLIP_MOVE_SPEED) {
            direction = (endX - this._startX) > 0 ? 1 : -1;
        }

        if (!direction) {
            direction = (this._mouse.x >= PAGE_WIDTH / 2) ? 1 : -1
        }

        // 判断 target 1 或者 -1,翻页
        if (direction === -1) {
            flip.target = -1;
            //判断是否翻页
            if(this._currentDirection === DIRECTION.RIGHT){
                this.pageIndex = Math.min(this._pageIndex + 1, this._flips.length - 1)
            }else{
                this.pageIndex = this.pageIndex;
            }
        }
        else if (direction === 1) {
            flip.target = 1;
            //判断是否翻页
            if(this._currentDirection === DIRECTION.LEFT){
               this.pageIndex = Math.max(this._pageIndex - 1, 0);
            }else{
                this.pageIndex = this.pageIndex;
            }
        }

        //重置状态
        flip.dragging = false;
    }

    /**
     * 绘制翻页效果
     * @param {flip} flip 当前 flip 对象
     */
    _drawFlip(flip) {
        //翻书力度 在书本中间最大 决定页面透视距离的最高点
        let strength = 1 - Math.abs(flip.progress);

        // 已经翻过的页面宽度
        let foldWidth = (PAGE_WIDTH / 2) * (1 - flip.progress);

        // 翻起的页面的x坐标(下一页可见区域的最左)
        let foldX = PAGE_WIDTH * flip.progress + foldWidth;

        // 页面透视的垂直高度
        let verticalOutdent = FLIP_STRENGTH * strength;

        // 左右阴影的最大宽度 共有三层阴影
        let paperShadowWidth = (PAGE_WIDTH * 0.5) * Math.max(Math.min(1 - flip.progress, 0.5), 0);
        let rightShadowWidth = (PAGE_WIDTH * 0.5) * Math.max(Math.min(strength, 0.5), 0);
        let leftShadowWidth = (PAGE_WIDTH * 0.5) * Math.max(Math.min(strength, 0.5), 0);

        // 根据页面翻页位置 通过改变宽度来改变内容显示 
        flip.page.style.transform = `translate3D(${foldX - PAGE_WIDTH}px,0,0)`;
        flip.paper.style.transform = `translate3D(${PAGE_WIDTH - foldX}px,0,0)`;


        this._context.save();
        this._context.translate(CANVAS_PADDING_HORIZONTAL + 0, PAGE_Y + CANVAS_PADDING_VERTICAL);

        // 画左边较短的阴影 根据页面高度变化
        this._context.strokeStyle = `rgba(0,0,0,${0.05 * strength})`;
        this._context.lineWidth = 30 * strength;
        this._context.beginPath();
        this._context.moveTo(foldX - foldWidth, -verticalOutdent * 0.5);
        this._context.lineTo(foldX - foldWidth, PAGE_HEIGHT + (verticalOutdent * 0.5));
        this._context.stroke();

        //右边阴影
        let rightShadowGradient = this._context.createLinearGradient(foldX, 0, foldX + rightShadowWidth, 0);
        rightShadowGradient.addColorStop(0, `rgba(0,0,0,${strength * 0.2})`);
        rightShadowGradient.addColorStop(0.8, `rgba(0,0,0,0.0)`);

        this._context.fillStyle = rightShadowGradient;
        this._context.beginPath();
        this._context.moveTo(foldX, 0);
        this._context.lineTo(foldX + rightShadowWidth, 0);
        this._context.lineTo(foldX + rightShadowWidth, PAGE_HEIGHT);
        this._context.lineTo(foldX, PAGE_HEIGHT);
        this._context.fill();

        //左边长阴影
        let leftShadowGradient = this._context.createLinearGradient(foldX - foldWidth - leftShadowWidth, 0, foldX - foldWidth, 0);
        leftShadowGradient.addColorStop(0, `rgba(0,0,0,0.0)`);
        leftShadowGradient.addColorStop(1, `rgba(0,0,0,${strength * 0.15})`);

        this._context.fillStyle = leftShadowGradient;
        this._context.beginPath();
        this._context.moveTo(foldX - foldWidth - leftShadowWidth, 0);
        this._context.lineTo(foldX - foldWidth, 0);
        this._context.lineTo(foldX - foldWidth, PAGE_HEIGHT);
        this._context.lineTo(foldX - foldWidth - leftShadowWidth, PAGE_HEIGHT);
        this._context.fill();

        //页面背面的高光与阴影
        let foldGradint = this._context.createLinearGradient(foldX - paperShadowWidth, 0, foldX, 0);
        foldGradint.addColorStop(0.35, `#fafafa`);
        foldGradint.addColorStop(0.73, `#eeeeee`);
        foldGradint.addColorStop(0.9, `#fafafa`);
        foldGradint.addColorStop(1.0, `#e2e2e2`);

        this._context.fillStyle = foldGradint;
        this._context.strokeStyle = `rgba(0,0,0,0.06)`;
        this._context.lineWidth = 0.5;

        //纸张效果
        this._context.beginPath();
        this._context.moveTo(foldX, 0);
        this._context.lineTo(foldX, PAGE_HEIGHT);
        this._context.quadraticCurveTo(foldX, PAGE_HEIGHT + (verticalOutdent * 2), foldX - foldWidth, PAGE_HEIGHT + verticalOutdent);
        this._context.lineTo(foldX - foldWidth, -verticalOutdent);
        this._context.quadraticCurveTo(foldX, -verticalOutdent * 2, foldX, 0);

        this._context.fill();
        this._context.stroke();


        this._context.restore();

    }

    /**
     * 设置当前页面
     * @param {number} page 页面从 1 开始
     * @param {boolean} isAniamte 是否翻页动画
     */
    turnToPage(page, isAnimate) {
        if (!this._pages[page - 1] || this._pageIndex === page - 1) {
            return;
        }

        (this._pages || []).forEach((pageEle, index) => {
            let paperEle = pageEle.getElementsByClassName('almanacPaper')[0];

            if (index < page - 1) {
                // pageEle.style.width = 0;
                pageEle.style.transform = `translate3D(${-PAGE_WIDTH}px,0,0)`;
                paperEle.style.transform = `translate3D(${PAGE_WIDTH}px,0,0)`;

                this._flips[index].target = -1;
                this._flips[index].progress = -1;
            } else {
                pageEle.style.transform = `translate3D(0,0,0)`;
                paperEle.style.transform = `translate3D(0,0,0)`;
            }
        })

        if (isAnimate) {
            if (page - 1 > this._pageIndex) {
                this._flips[this._pageIndex].target = -1;
            } else {
                this._flips[this._pageIndex - 1].target = 1;
            }
        }

        this._pageIndex = page - 1;
    }

    /**
     * 启用翻页
     */
    enableFlip(){
        this._enable = true;
    }

    /**
     * 禁止翻页
     */
    disableFlip(){
        this._enable = false;
    }

    /**
     * 书本页面变化时候调用
     */
    resetPages(pages) {
        this._pageIndex = 0;
        this._pages = Array.from(pages);
        this._flips = [];
        this._pages.forEach((page, index) => {
            page.style.zIndex = this._pages.length - index;
            this._flips.push({
                progress: 1,
                target: 1,
                page: page,
                paper: page.getElementsByClassName('almanacPaper')[0],
                dragging: false
            })
        });
    }

    /**
     * 初始化
     */
    _init() {
        //书本尺寸
        BOOK_WIDTH = this._book.offsetWidth;
        BOOK_HEIGHT = this._book.offsetHeight;

        //页面尺寸
        PAGE_WIDTH = BOOK_WIDTH;
        PAGE_HEIGHT = BOOK_HEIGHT;

        //书的顶部与纸张的间距
        PAGE_Y = (BOOK_HEIGHT - PAGE_HEIGHT) / 2;

        //设置 filip 对象
        this._pages.forEach((page, index) => {
            page.style.zIndex = this._pages.length - index;

            this._flips.push({
                //当前翻页的进度 -1 ～ 1 ; -1为最左，1为最右
                progress: 1,
                //progress 的目标
                target: 1,
                //页面的dom
                page: page,
                //页面的paper元素
                paper: page.getElementsByClassName('almanacPaper')[0],
                //当页面被拖动时为true
                dragging: false
            })
        });

        //设置画布大小 书本大小 + CANVAS_PADDING
        this._canvas.width = BOOK_WIDTH + (CANVAS_PADDING_HORIZONTAL * 2);
        this._canvas.height = BOOK_HEIGHT + (CANVAS_PADDING_VERTICAL * 2);

        //移动画布使书本在画布中间正确位置
        this._canvas.style.top = `${-CANVAS_PADDING_VERTICAL}px`;
        this._canvas.style.left = `${-CANVAS_PADDING_HORIZONTAL}px`;

        //按照fps为 RENDER_FPS 渲染页面
        requestAnimationFrame(() => {
            this._doRender()
        })

        //绑定事件
        this._bindEvent();
        this._bindData();
    }

    /**
     * 每一帧执行render
     */
    _doRender() {
        this._render();
        requestAnimationFrame(() => {
            this._doRender();
        });
    }

    resetPageSize() {
        BOOK_WIDTH = this._book.offsetWidth;
        BOOK_HEIGHT = this._book.offsetHeight;

        PAGE_WIDTH = BOOK_WIDTH;
        PAGE_HEIGHT = BOOK_HEIGHT;

        PAGE_Y = (BOOK_HEIGHT - PAGE_HEIGHT) / 2;

        this._canvas.width = BOOK_WIDTH + (CANVAS_PADDING_HORIZONTAL * 2);
        this._canvas.height = BOOK_HEIGHT + (CANVAS_PADDING_VERTICAL * 2);

        this._canvas.style.top = `${-CANVAS_PADDING_VERTICAL}px`;
        this._canvas.style.left = `${-CANVAS_PADDING_HORIZONTAL}px`;

        (this._pages || []).forEach((pageEle, index) => {
            if (index < this.pageIndex) {
                pageEle.style.width = 0;
                this._flips[index].target = -1;
                this._flips[index].progress = -1;
            } else {
                pageEle.style.width = `${PAGE_WIDTH}px`;
            }
        })
    }

}