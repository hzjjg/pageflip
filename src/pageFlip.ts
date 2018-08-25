import { flipConfig, flip } from "./types";
import { DisplayType, DirectionType } from "./enum";

/**
 * @class 翻页效果
 */
export class PageFlip {

    private bookWidth: number;
    private bookHeight: number;
    private pageWidth: number;
    private pageHeight: number;
    private pageY: number = 0;
    private canvasPaddingHorizontal: number;
    private canvasPaddingVeritical: number;
    private flipSpeed: number;
    private flipMoveSpeed: number;
    private flipStrength: number;
    private canvas: HTMLCanvasElement;
    private book: HTMLElement;
    private pages: HTMLCollection;
    private display: DisplayType

    private pageIndex = 0;
    private canvasContext: CanvasRenderingContext2D;
    private mousePos = { x: 0, y: 0 };
    private flips: flip[] = [];
    private isSingle: boolean;
    private currentDireciton: DirectionType;
    private startX = 0;
    private startTime = 0;
    private touchDragging = false;
    private enable = true;
    private onFlipComplete: () => {};

    constructor(config: flipConfig) {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const element = (<any>config)[key];
                typeof element !== 'undefined' && ((<any>this)[key] = element);
            }
        }

        this.canvasContext = this.canvas.getContext('2d');
        this.isSingle = this.display === DisplayType.SINGLE;

        this.init();
    }

    private render() {

    }

    private bindEvent() {

    }

    private drapDwon(event: TouchEvent) {

    }

    private drapMove(event: TouchEvent) {

    }

    private setMousePos(x: number, y: number) {

    }

    private drapRelease(event: TouchEvent) {

    }

    private drapFlip(flip: any) {

    }

    private doRender() {

    }

    public turnToPage(page: number, isAnimate: boolean) {

    }

    public enbleFlip() {

    }

    public disableFlip() {

    }

    public resetPage() {

    }


    public resetPageSize() {

    }

    private init() {

    }


}