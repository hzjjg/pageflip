import { FlipConfig, Flip } from "./types";
import { DisplayType, DirectionType } from "./enum";

/**
 * @class 翻页效果
 */
export default class PageFlip {

    /** 页面宽度 */
    private pageWidth: number = 0;

    /** 页面高度 */
    private pageHeight: number = 0;

    /** 待废弃属性 */
    private canvasPaddingHorizontal: number = 10;

    /** 待废弃属性 */
    private canvasPaddingVeritical: number = 20;

    /** 翻页释放时的速度 0 - 1 */
    private flipSpeed: number = 0.34;

    /** 到达需要翻页时候的速度 px/ms */
    private flipMoveSpeed: number = 0.5;

    /** 翻页力度，音响翻页的高度 */
    private flipStrength: number = 10;

    /** 画布的DOM */
    private canvas: HTMLCanvasElement;

    /** 书本的dom */
    private book: HTMLElement;

    /** 页面的dom */
    private _pages: HTMLElement[] = [];

    /** 单双页 */
    private display: DisplayType = DisplayType.SINGLE

    /** 好的 */
    private _pageIndex = 0;

    /** 画布的 context */
    private canvasContext: CanvasRenderingContext2D;

    /** 鼠标/手指的位置 */
    private mousePos = { x: 0, y: 0 };

    /** 所有翻页对象 */
    private flips: Flip[] = [];

    /** 当前移动的方向 */
    private currentDireciton: DirectionType;

    /** 开始移动时的x坐标 */
    private startX = 0;

    /** 开始移动的时间 */
    private startTime = 0;

    /** 是否正在拖动 */
    private touchDragging = false;

    /** 是否启用翻页 */
    private enable = true;

    /** 翻页页面页码变化的回调 */
    private onFlipComplete: (page: number, oldPage: number) => {};

    constructor(config: FlipConfig) {
        //配置设置的属性
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const element = (<any>config)[key];
                typeof element !== 'undefined' && ((<any>this)[key] = element);
            }
        }

        this.init();
    }

    /**
     * 页面的dom
     */
    private get pages(): HTMLElement[] {
        return Array.from(this._pages);
    }

    /**
    * 页面的dom
    */
    private set pages(v: HTMLElement[]) {
        this._pages = v;
    }

    /**
     * 当前页码
     */
    private get pageIndex(): number {
        return this._pageIndex;
    }

    /**
     * 当前页码
     */
    private set pageIndex(v: number) {
        try {
            this.onFlipComplete && this.onFlipComplete.call({}, ...[v + 1, this.pageIndex + 1]);
        } catch (error) {
            console.log(error);
        }
        this._pageIndex = v;
    }

    /**
     * 是否正在拖动
     */
    public get isDragging(): boolean {
        return this.touchDragging;
    }

    /**
     * 渲染翻页效果
     */
    private render() {
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.flips.forEach((flip) => {
            if (flip.dragging) {
                //target 为当前鼠标的位置 (-1 ~ 1之间)
                flip.target = Math.max(Math.min(this.mousePos.x / this.pageWidth, 1), -1);
            }

            //按照速度将 progress 增加至 target
            flip.progress += (flip.target - flip.progress) * Math.max(Math.min(this.flipSpeed, 1), 0);

            //拖动页面中 或者 progress没完成 则渲染
            if (flip.dragging || Math.abs(flip.progress) < 0.997) {
                this.drawFlip(flip);
            }
        })
    }

    /**
     * 绑定触摸/鼠标拖动事件
     */
    private bindEvent() {
        //开始触摸
        document.addEventListener('touchstart', e => { this.drapDwon(e) }, false);
        //触摸拖动
        document.addEventListener("touchmove", e => { this.drapMove(e) }, false);
        //触摸释放
        document.addEventListener("touchend", e => { this.drapRelease(e) }, false);
    }

    /**
     * 拖动准备
     * @param event 鼠标/触摸事件
     */
    private drapDwon(event: TouchEvent) {
        //TODO 兼容pc鼠标事件
        // event.touches && this._drapMove(event);

        // 由于需要要从边缘滑动，所以不判断鼠标是否在页面内
        // if (this._mouse.x <= PAGE_WIDTH) { }

        this.startX = event.touches[0].clientX;
        this.startTime = new Date().getTime();

        //防止选中文字
        // event.preventDefault();
    }

    /**
     * 拖动
     * @param event 鼠标/触摸事件
     */
    private drapMove(event: TouchEvent) {
        let x
        let y;
        if (event.touches) {
            let touch = event.touches[0];
            x = touch.clientX;
            y = touch.clientY;
        }
        // TODO鼠标事件
        //  else {
        //     x = event.clientX;
        //     y = event.clientY
        // }

        if (!this.enable) {
            return;
        }

        if (this.touchDragging) {
            this.setMousePos(x, y);
        } else {
            //设置拖动一点距离后才翻页 20px
            let direction = x - this.startX;
            this.touchDragging = Math.abs(direction) >= 20;

            if (!this.touchDragging) {
                return;
            }

            let flipIndex = this.pageIndex + (direction > 0 ? -1 : 0);
            let flip = this.flips[flipIndex];

            if (!flip) {
                this.drapRelease(event);
                return;
            }

            //在右边最后一页，禁止翻动。
            if (direction < 0 && flipIndex === this.flips.length - 1) {
                this.drapRelease(event);
                return;
            }

            this.currentDireciton = direction > 0 ? DirectionType.LEFT : DirectionType.RIGHT;
            flip.dragging = true;
        }
    }

    /**
     * 拖动释放
     * @param event 鼠标事件
     */
    private drapRelease(event: TouchEvent) {
        // 如果页面在拖动中，翻页到目标
        let flip = this.flips.find(item => item.dragging);
        let direction: number = null;

        this.touchDragging = false;

        if (!flip) {
            return
        };

        let touches = event.touches[0] || event.changedTouches[0];
        let endX = touches.clientX;
        let endTime = new Date().getTime();

        //滑动速度大的时候翻页
        if (Math.abs((endX - this.startX) / (endTime - this.startTime)) > this.flipMoveSpeed) {
            direction = (endX - this.startX) > 0 ? 1 : -1;
        }

        if (!direction) {
            direction = (this.mousePos.x >= this.pageWidth / 2) ? 1 : -1
        }

        // 判断 target 1 或者 -1,翻页
        if (direction === -1) {
            flip.target = -1;
            //判断是否翻页
            if (this.currentDireciton === DirectionType.RIGHT) {
                this.pageIndex = Math.min(this.pageIndex + 1, this.flips.length - 1)
            } else {
                this.pageIndex = this.pageIndex;
            }
        }
        else if (direction === 1) {
            flip.target = 1;
            //判断是否翻页
            if (this.currentDireciton === DirectionType.LEFT) {
                this.pageIndex = Math.max(this.pageIndex - 1, 0);
            } else {
                this.pageIndex = this.pageIndex;
            }
        }

        //重置状态
        flip.dragging = false;
    }

    /**
     * 设置鼠标相对纸张位置
     * @param {number} x 
     * @param {number} y 
     */
    private setMousePos(x: number, y: number) {
        // 设置鼠标的位置 下方中点坐标为(0，0)
        // this._mouse.x = event.clientX - this._book.offsetLeft - (BOOK_WIDTH / 2);
        this.mousePos.x = x - this.book.offsetLeft;
        this.mousePos.y = -y + this.book.offsetTop + this.pageHeight;
    }

    /**
     * 绘制翻页效果
     * @param {Flip} flip 当前 flip 对象
     */
    private drawFlip(flip: Flip) {
        //翻书力度 在书本中间最大 决定页面透视距离的最高点
        let strength = 1 - Math.abs(flip.progress);

        // 已经翻过的页面宽度
        let foldWidth = (this.pageWidth / 2) * (1 - flip.progress);

        // 翻起的页面的x坐标(下一页可见区域的最左)
        let foldX = this.pageWidth * flip.progress + foldWidth;

        // 页面透视的垂直高度
        let verticalOutdent = this.flipStrength * strength;

        // 左右阴影的最大宽度 共有三层阴影
        let paperShadowWidth = (this.pageWidth * 0.5) * Math.max(Math.min(1 - flip.progress, 0.5), 0);
        let rightShadowWidth = (this.pageWidth * 0.5) * Math.max(Math.min(strength, 0.5), 0);
        let leftShadowWidth = (this.pageWidth * 0.5) * Math.max(Math.min(strength, 0.5), 0);

        // 根据页面翻页位置 通过改变宽度来改变内容显示 
        flip.page.style.transform = `translate3D(${foldX - this.pageWidth}px,0,0)`;
        flip.paper.style.transform = `translate3D(${this.pageWidth - foldX}px,0,0)`;


        this.canvasContext.save();
        this.canvasContext.translate(this.canvasPaddingHorizontal + 0, this.canvasPaddingVeritical);

        // 画左边较短的阴影 根据页面高度变化
        this.canvasContext.strokeStyle = `rgba(0,0,0,${0.05 * strength})`;
        this.canvasContext.lineWidth = 30 * strength;
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(foldX - foldWidth, -verticalOutdent * 0.5);
        this.canvasContext.lineTo(foldX - foldWidth, this.pageHeight + (verticalOutdent * 0.5));
        this.canvasContext.stroke();

        //右边阴影
        let rightShadowGradient = this.canvasContext.createLinearGradient(foldX, 0, foldX + rightShadowWidth, 0);
        rightShadowGradient.addColorStop(0, `rgba(0,0,0,${strength * 0.2})`);
        rightShadowGradient.addColorStop(0.8, `rgba(0,0,0,0.0)`);

        this.canvasContext.fillStyle = rightShadowGradient;
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(foldX, 0);
        this.canvasContext.lineTo(foldX + rightShadowWidth, 0);
        this.canvasContext.lineTo(foldX + rightShadowWidth, this.pageHeight);
        this.canvasContext.lineTo(foldX, this.pageHeight);
        this.canvasContext.fill();

        //左边长阴影
        let leftShadowGradient = this.canvasContext.createLinearGradient(foldX - foldWidth - leftShadowWidth, 0, foldX - foldWidth, 0);
        leftShadowGradient.addColorStop(0, `rgba(0,0,0,0.0)`);
        leftShadowGradient.addColorStop(1, `rgba(0,0,0,${strength * 0.15})`);

        this.canvasContext.fillStyle = leftShadowGradient;
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(foldX - foldWidth - leftShadowWidth, 0);
        this.canvasContext.lineTo(foldX - foldWidth, 0);
        this.canvasContext.lineTo(foldX - foldWidth, this.pageHeight);
        this.canvasContext.lineTo(foldX - foldWidth - leftShadowWidth, this.pageHeight);
        this.canvasContext.fill();

        //页面背面的高光与阴影
        let foldGradint = this.canvasContext.createLinearGradient(foldX - paperShadowWidth, 0, foldX, 0);
        foldGradint.addColorStop(0.35, `#fafafa`);
        foldGradint.addColorStop(0.73, `#eeeeee`);
        foldGradint.addColorStop(0.9, `#fafafa`);
        foldGradint.addColorStop(1.0, `#e2e2e2`);

        this.canvasContext.fillStyle = foldGradint;
        this.canvasContext.strokeStyle = `rgba(0,0,0,0.06)`;
        this.canvasContext.lineWidth = 0.5;

        //纸张效果
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(foldX, 0);
        this.canvasContext.lineTo(foldX, this.pageHeight);
        this.canvasContext.quadraticCurveTo(foldX, this.pageHeight + (verticalOutdent * 2), foldX - foldWidth, this.pageHeight + verticalOutdent);
        this.canvasContext.lineTo(foldX - foldWidth, -verticalOutdent);
        this.canvasContext.quadraticCurveTo(foldX, -verticalOutdent * 2, foldX, 0);

        this.canvasContext.fill();
        this.canvasContext.stroke();


        this.canvasContext.restore();
    }

    /**
     * 每一帧执行一次render
     */
    private runRender() {
        this.render();
        requestAnimationFrame(() => {
            this.runRender();
        })
    }

    /**
     * 设置当前页面
     * @param {number} page 页面从 1 开始
     * @param {boolean} isAniamte 是否翻页动画
     */
    public turnToPage(page: number, isAnimate?: boolean) {
        if (!this.pages[page - 1] || this.pageIndex === page - 1) {
            return;
        }

        (this.pages || []).forEach((pageEle, index) => {
            let paperEle = <HTMLElement>pageEle.getElementsByClassName('almanacPaper')[0];

            if (index < page - 1) {
                // pageEle.style.width = 0;
                pageEle.style.transform = `translate3D(${-this.pageWidth}px,0,0)`;
                paperEle.style.transform = `translate3D(${this.pageWidth}px,0,0)`;

                this.flips[index].target = -1;
                this.flips[index].progress = -1;
            } else {
                pageEle.style.transform = `translate3D(0,0,0)`;
                paperEle.style.transform = `translate3D(0,0,0)`;
            }
        })

        if (isAnimate) {
            if (page - 1 > this.pageIndex) {
                this.flips[this.pageIndex].target = -1;
            } else {
                this.flips[this.pageIndex - 1].target = 1;
            }
        }

        this._pageIndex = page - 1;

    }

    /**
     * 启用翻页
     */
    public enbleFlip() {
        this.enable = true;
    }

    /**
     * 禁止翻页
     */
    public disableFlip() {
        this.enable = false;
    }

    /**
     * 页面dom变化时候，用来重置页面
     */
    public resetPages(pages: HTMLElement[]) {
        this._pageIndex = 0;
        this.pages = Array.from(pages);
        this.flips = [];
        this.pages.forEach((page, index) => {
            page.style.zIndex = (this.pages.length - index).toString();
            this.flips.push({
                progress: 1,
                target: 1,
                page: page,
                paper: <HTMLElement>page.getElementsByClassName('almanacPaper')[0],
                dragging: false
            })
        });
    }


    /**
     * 重设页面大小
     */
    public resetPageSize() {
        this.canvas.width = this.pageWidth + (this.canvasPaddingHorizontal * 2);
        this.canvas.height = this.pageHeight + (this.canvasPaddingVeritical * 2);

        this.canvas.style.top = `${-this.canvasPaddingVeritical}px`;
        this.canvas.style.left = `${-this.canvasPaddingHorizontal}px`;

        (this.pages || []).forEach((pageEle, index) => {
            if (index < this.pageIndex) {
                pageEle.style.width = '0px';
                this.flips[index].target = -1;
                this.flips[index].progress = -1;
            } else {
                pageEle.style.width = `${this.pageWidth}px`;
            }
        })
    }

    /**
     * 绘制画布
     */
    private initCanvas() {
        //生成画布
        this.canvas = document.createElement('canvas');
        this.book.insertBefore(this.canvas, this.book.childNodes[0]);
        this.canvas.style.position = 'absolute';
        this.canvas.style.zIndex = '9999';
        this.canvasContext = this.canvas.getContext('2d');

        //设置画布大小 页面大小 + canvasPadding
        this.canvas.width = this.pageWidth + (this.canvasPaddingHorizontal * 2);
        this.canvas.height = this.pageHeight + (this.canvasPaddingVeritical * 2);

        //移动画布使书本在画布中间正确位置
        this.canvas.style.top = `${-this.canvasPaddingVeritical}px`;
        this.canvas.style.left = `${-this.canvasPaddingHorizontal}px`;
    }

    /**
     * 初始化页面翻页对象
     */
    private initPages() {

        //页面尺寸
        if (this.pages.length <= 0) {
            return;
        }

        this.pageWidth = this.pages[0].offsetWidth;
        this.pageHeight = this.pages[0].offsetHeight;

        //设置 filip 对象
        this.pages.forEach((page, index) => {
            page.style.zIndex = (this.pages.length - index).toString();

            this.flips.push({
                //当前翻页的进度 -1 ～ 1 ; -1为最左，1为最右
                progress: 1,
                //progress 的目标
                target: 1,
                //页面的dom
                page: page,
                //页面的paper元素
                paper: <HTMLElement>page.getElementsByClassName('almanacPaper')[0],
                //当页面被拖动时为true
                dragging: false
            })
        });
    }

    /**
     * 初始化
     */
    private init() {

        this.initPages();

        this.initCanvas();

        this.runRender()

        this.bindEvent();
    }


}