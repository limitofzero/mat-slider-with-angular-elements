import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {fromEvent, Subject} from 'rxjs';
import {debounceTime, filter, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'mat-slider',
  template: `
    <div class="wrapper" #wrapper>
      <div class="line"></div>
      <div class="circle" (mousedown)="startSliding()" draggable="false" [style.left]="position"></div>
    </div>
  `,
  styleUrls: ['./mat-slider.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatSliderComponent implements AfterViewInit {
  private isSliding = false;
  private width = 0;
  private readonly onDestroy = new Subject<void>();

  public position = '0px';

  @Input()
  public value = 0;

  @Input()
  public range = 100;

  @Output()
  valueChanged = new EventEmitter<number>();

  @ViewChild('wrapper')
  wrapper: ElementRef;

  get wrapperEl(): HTMLElement {
    return this.wrapper.nativeElement;
  }

  constructor(private cdr: ChangeDetectorRef) {
    this.listenWindowResize();
    this.listenMouseMove();
  }

  private setPosition(event: MouseEvent) {
    const position = event.pageX - this.wrapperEl.offsetLeft;
    if (position >= 0 && position <= this.width) {
      this.position = `${ position }px`;
      this.calculateValue(position);
      this.valueChanged.next(this.value);
      this.cdr.detectChanges();
    }
  }

  private calculateValue(position: number): void {
    const onePercent = this.getOnePercentRange();
    const value = position / onePercent;
    this.value = Math.round(value);
  }

  private getOnePercentRange(): number {
    return this.width / this.range;
  }

  public ngAfterViewInit(): void {
    this.recalcWidthAndPosition();
  }

  private setWidth(): void {
    const wrapperRect = this.wrapperEl.getClientRects();
    this.width = wrapperRect[0].width;
  }

  private initPosition() {
    const percent = this.getOnePercentRange();
    const position = this.value * percent;
    this.position = String(position) + 'px';
  }

  private listenWindowResize(): void {
    fromEvent(window, 'resize').pipe(
      debounceTime(300),
      takeUntil(this.onDestroy)
    ).subscribe({
      next: () => this.recalcWidthAndPosition()
    });
  }

  private recalcWidthAndPosition(): void {
    this.setWidth();
    this.initPosition();
    this.cdr.detectChanges();
  }

  private listenMouseMove(): void {
    fromEvent(window, 'mousemove').pipe(
      filter(() => this.isSliding),
      takeUntil(this.onDestroy)
    ).subscribe({
      next: (event: MouseEvent) => this.setPosition(event)
    });
  }

  @HostListener('window:mouseup')
  private stopSliding(): void {
    this.isSliding = false;
  }

  public startSliding(): void {
    this.isSliding = true;
  }
}
