import { DisplayType } from "./enum";

/**
 * 配置项
 */
export interface flipConfig{
    /**
     * 书本宽度 px
     */
    bookWidth?:number;

    /**
     * 书本高度 px
     */
    bookHeight?:number;

    /**
     * 页面宽度
     */
    pageWidth?:number;

    /**
     * 页面高度
     */
    pageHeight?:number;

    /**
     * 待废弃
     */
    pageY:number;

    /**
     * 待废弃属性
     */
    canvasPaddingHorizontal?:number;

    /**
     * 待废弃属性
     */
    canvasPaddingVeritical?:number;

    /**
     * 翻页释放时的速度 0 - 1
     */
    flipSpeed?:number;

    /**
     * 到达需要翻页时候的速度 px/ms
     */
    flipMoveSpeed?:number;

    /**
     * 翻页力度，音响翻页的高度
     */
    flipStrength?:number;

    /**
     * 画布的DOM
     */
    canvas:HTMLCanvasElement;

    /**
     * 书本的dom
     */
    book:HTMLElement;

    /**
     * 页面的dom
     */
    pages?:HTMLCollection;

    /**
     * 单双页
     */
    display:DisplayType
}

/**
 * 翻页的对象
 */
export interface flip{

    /**
     * 当前翻页的进度 -1 ～ 1 ; -1为最左，1为最右
     */
    progress: number,
    
    /**
     * progress 的目标值
     */
    target: number,

    /**
     * 页面的dom
     */
    page: HTMLElement,

    /**
     * 页面的pager元素
     */
    paper: HTMLElement,

    /**
     * 是否在拖动
     */
    dragging: boolean
}