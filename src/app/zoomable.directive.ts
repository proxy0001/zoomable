import { Directive, ElementRef, HostListener, HostBinding, Input, Renderer } from '@angular/core';
interface Point {
  x: number;
  y: number;
}
interface Size {
  width: number;
  height: number;
}
interface Point3d extends Point {
  z: number;
}
interface PointId extends Point {
  id: number;
}
interface Duration {
  start: number;
  delta: number;
  end: number;
}
interface PointDuration {
  start: Point;
  delta: Point;
  end: Point;
}
interface PointAryDuration {
  start: Array<Point>;
  delta: Array<Point>;
  end: Array<Point>;
}

interface Render {
  position: Point3d;
  scale: number;
}
interface BoxObj {
  size: Size;
  center: Point;
  position: Point;
  diagonal: Point;
  scale: number;
  scaleDuration: Duration;
}

interface HandObj {
  touches: Array<PointId>;
  moveTouches: Array<PointId>;
  position: PointDuration;
  distance: Duration;
  time: Duration;
}

interface Muster {
  stage: BoxObj,
  actor: BoxObj,
  bounding: BoxObj,
  render: Render,
}

@Directive({
  selector: '[appZoomable]' // Attribute selector
})
export class ZoomableDirective {

  private initial: boolean = false;

  private _stage: BoxObj = {
    size: { width: 0, height: 0 },
    center: { x: 0, y: 0, },
    position: { x: 0, y: 0, },
    diagonal: { x: 0, y: 0, },
    scale: 1,
    scaleDuration: { start: 1, delta: 1, end: 1 },
  };
  private _actor: BoxObj = {
    size: { width: 0, height: 0 },
    center: { x: 0, y: 0, },
    position: { x: 0, y: 0, },
    diagonal: { x: 0, y: 0, },
    scale: 1,
    scaleDuration: { start: 1, delta: 1, end: 1 },
  };
  private _hand: HandObj = {
    touches: [],
    moveTouches: [],
    position: {
      start: { x: 0, y: 0, },
      delta: { x: 0, y: 0, },
      end: { x: 0, y: 0, },
    },
    time: { start: 0, delta: 0, end: 0, },
    distance: { start: 0, delta: 0, end: 0,},
  };
  private _render: Render = {
    position: { x: 0, y: 0, z: 0 },
    scale: 1
  };

  private _bounding: BoxObj = {
    size: { width: 0, height: 0 },
    center: { x: 0, y: 0, },
    position: { x: 0, y: 0 },
    diagonal: { x: 0, y: 0 },
    scale: 1,
    scaleDuration: { start: 1, delta: 1, end: 1 },
  };

  private _origin: Muster = {
    stage: JSON.parse( JSON.stringify( this._stage ) ),
    actor: JSON.parse( JSON.stringify( this._actor ) ),
    bounding: JSON.parse( JSON.stringify( this._bounding ) ),
    render: JSON.parse( JSON.stringify( this._render ) ),
  };
  private _handler: any;
  private _animate: any;
  private _gesture: string = '';
  // 1N(牛頓力) = 1M(物體質量) * 1A(加速度)
  // 1V(速度) = 1px(距離) / 1ms(時間)
  // 1A(加速度) = 2 * 1px(距離) / 1ms * 1ms(時間平方)

  constructor(
    private el: ElementRef,
    private rdr: Renderer
  ) {

  }

  public init ( scale?: number ) {
    this.rdr.setElementStyle(this.actor, 'transformOrigin', '0% 0%');

    let offset = this.el.nativeElement.getBoundingClientRect();
    this._stage.scale = 1;
    this._stage.size.width = offset.width;
    this._stage.size.height = offset.height;
    this._stage.position.x = offset.left;
    this._stage.position.y = offset.top;
    this._stage.center.x = this._stage.position.x + this._stage.size.width / 2;
    this._stage.center.y = this._stage.position.y + this._stage.size.height / 2;
    this._stage.diagonal.x = this._stage.position.x + this._stage.size.width;
    this._stage.diagonal.y = this._stage.position.y + this._stage.size.height;

    if ( !scale ) scale = 1;
    this._actor.scale = scale;
    this.renderScale( this._actor.scale );
    offset = this.actor.getBoundingClientRect();

    this._actor.size.width = offset.width;
    this._actor.size.height = offset.height;
    this._actor.position.x = this._stage.center.x - this._stage.position.x - this._actor.size.width / 2;
    this._actor.position.y = this._stage.center.y - this._stage.position.y - this._actor.size.height / 2;
    this._actor.center.x = this._actor.position.x + this._actor.size.width / 2;
    this._actor.center.y = this._actor.position.y + this._actor.size.height / 2;
    this._actor.diagonal.x = this._actor.position.x + this._actor.size.width;
    this._actor.diagonal.y = this._actor.position.y + this._actor.size.height;


    this._bounding.center.x = this._stage.center.x - this._stage.position.x;
    this._bounding.center.y = this._stage.center.y - this._stage.position.y;
    this._bounding.size.width = ( this._actor.size.width >= this._stage.size.width ) ? 2 * this._actor.size.width - this._stage.size.width : this._actor.size.width;
    this._bounding.size.height = ( this._actor.size.height >= this._stage.size.height ) ? 2 * this._actor.size.height - this._stage.size.height : this._actor.size.height;
    this._bounding.position.x = this._bounding.center.x - this._bounding.size.width / 2;
    this._bounding.position.y = this._bounding.center.y - this._bounding.size.height / 2;
    this._bounding.diagonal.x = this._bounding.position.x + this._bounding.size.width;
    this._bounding.diagonal.y = this._bounding.position.y + this._bounding.size.height;

    this.translate( this._actor.position.x, this._actor.position.y, 0, this._actor.scale );

    // 儲存初始化的結果
    this._origin = {
      stage: JSON.parse( JSON.stringify( this._stage ) ),  
      actor: JSON.parse( JSON.stringify( this._actor ) ),
      bounding: JSON.parse( JSON.stringify( this._bounding ) ),
      render: JSON.parse( JSON.stringify( this._render ) ),
    }

    this.initial = true;

    return this;
  }
  ngOnInit () {
    console.log('ngOnInit:');
    console.log(this.actor);
  }

  @Input('appZoomable') private actor: HTMLElement;

  @HostBinding( 'style.perspective' ) @Input() perspective: string = '500px';
  @HostBinding( 'style.overflow' ) @Input() overflow: string = 'hidden';
  @HostBinding( 'style.backfaceVisibility' ) @Input() backface: string = 'hidden';

  @HostListener('window:resize', ['$event']) onResize ( ev ) {
    this.init();
  }

  @HostListener('click', ['$event']) onClick ( ev ) {

  }

  @HostListener('touchstart', ['$event']) onTouchStart ( ev ) {

    // 數值初始化
    this._hand.touches = [];
    this._hand.position = {
      start: { x: 0, y: 0},
      delta: { x: 0, y: 0},
      end: { x: 0, y: 0},
    };

    // 儲存所有起始的觸碰點資訊
    [].forEach.call( ev.touches, value => {
      this._hand.touches.push({ x: value.clientX, y: value.clientY, id: value.identifier });
    });

    // 觸碰開始時的時間數值記錄
    this._hand.time.start = ev.timeStamp;
    this._hand.time.end = ev.timeStamp;
    this._hand.time.delta = this._hand.time.end - this._hand.time.start;


    // 辨識兩點手勢 -> 放大縮小
    if ( this._hand.touches.length >= 2 ) {
      let maxDistance = 0;
      this._hand.touches.forEach( ( value, i ) => {
        this._hand.touches.forEach( (target, j ) => {
          if ( i === j ) return;
          let distance = this.sortout( Math.sqrt( Math.pow( Math.abs( value.x - target.x ), 2 ) + Math.pow( Math.abs( value.y - target.y ), 2 ) ) ) 
          maxDistance = ( distance > maxDistance ) ? distance : maxDistance;
        });
      });
      this._hand.distance.start = maxDistance;
      this._actor.scaleDuration.start = this._actor.scale;
    }

    // 停止所有未結束的動畫
    this.stopAnimate();
  }
  @HostListener('touchmove', ['$event']) onTouchMove ( ev ) {

    // 清空之前的過程紀錄點
    this._hand.moveTouches = [];
    // 儲存過程中的目標觸碰點資訊
    this._hand.touches.forEach( (value) => {
      let ta = [].find.call( ev.touches, target => target.identifier === value.id );
      if ( !ta ) return; 
      this._hand.moveTouches.push({ x: ta.clientX, y: ta.clientY, id: ta.identifier });
    });

    // 歸零以計算新的delta值
    this._hand.position.delta.x = 0;
    this._hand.position.delta.y = 0;  
    // 取得各觸碰點位移量的平均值
    this._hand.moveTouches.forEach( ( value ) => {
      let ta = this._hand.touches.find( target => target.id === value.id );
      if ( !ta ) return;
      this._hand.position.delta.x += ( value.x - ta.x ) / this._hand.touches.length;
      this._hand.position.delta.y += ( value.y - ta.y ) / this._hand.touches.length;
    });

    // 觸碰開始到此時之間的時間數值記錄
    this._hand.time.end = ev.timeStamp;
    this._hand.time.delta = this._hand.time.end - this._hand.time.start;

    // 辨識兩點手勢
    if ( this._hand.moveTouches.length >= 2 ) {
      // 計算最大的兩點距離
      let maxDistance = 0;
      this._hand.moveTouches.forEach( ( value, i ) => {
        this._hand.moveTouches.forEach( (target, j ) => {
          if ( i === j ) return;
          let distance = this.sortout( Math.sqrt( Math.pow( Math.abs( value.x - target.x ), 2 ) + Math.pow( Math.abs( value.y - target.y ), 2 ) ) ) 
          maxDistance = ( distance > maxDistance ) ? distance : maxDistance;
        });
      });

      this._hand.distance.delta = maxDistance - this._hand.distance.start;

      // 有放大縮小
      if ( this._hand.distance.delta !== 0 ) {
        let Ds = ( this._hand.distance.delta >= 0 ) ? 1 : -1;
        let percentage = this._hand.distance.delta / this._hand.distance.start;

        this._actor.scaleDuration.delta = 1 + percentage;

        this._actor.scale = this._actor.scaleDuration.start * this._actor.scaleDuration.delta;
        this._actor.scale = ( this._actor.scale > 0.1 ) ? this._actor.scale : 0.1;
        this._actor.scale = ( this._actor.scale < 10 ) ? this._actor.scale : 10;

        // 取得新的長寬
        let newWidth = this._origin.actor.size.width * this._actor.scale;
        let newHeight = this._origin.actor.size.height * this._actor.scale;

        let proporitionX = ( this._stage.center.x - this._actor.position.x ) / this._actor.size.width;
        let proporitionY = ( this._stage.center.y - this._actor.position.y ) / this._actor.size.height;
        let disparityX = newWidth - this._actor.size.width;
        let disparityY = newHeight - this._actor.size.height;
        // 取得新的座標
        let newPositionX = this._actor.position.x - this.sortout( disparityX * proporitionX );
        let newPositionY = this._actor.position.y - this.sortout( disparityY * proporitionY );

        // 重新賦值
        this._actor.position.x = this.sortout( newPositionX );
        this._actor.position.y = this.sortout( newPositionY );
        this._actor.size.width = newWidth;
        this._actor.size.height = newHeight;
        this._actor.center.x = this._actor.position.x + this._actor.size.width / 2;
        this._actor.center.y = this._actor.position.y + this._actor.size.height / 2;
        this._actor.diagonal.x = this._actor.position.x + this._actor.size.width;
        this._actor.diagonal.y = this._actor.position.y + this._actor.size.height;
        // 重新取得bouding物件的值
        this._bounding.center.x = this._stage.center.x - this._stage.position.x;
        this._bounding.center.y = this._stage.center.y - this._stage.position.y;
        this._bounding.size.width = ( this._actor.size.width >= this._stage.size.width ) ? 2 * this._actor.size.width - this._stage.size.width : this._actor.size.width;
        this._bounding.size.height = ( this._actor.size.height >= this._stage.size.height ) ? 2 * this._actor.size.height - this._stage.size.height : this._actor.size.height;
        this._bounding.position.x = this._bounding.center.x - this._bounding.size.width / 2;
        this._bounding.position.y = this._bounding.center.y - this._bounding.size.height / 2;
        this._bounding.diagonal.x = this._bounding.position.x + this._bounding.size.width;
        this._bounding.diagonal.y = this._bounding.position.y + this._bounding.size.height;
      }

    }

    // 新的位置資訊
    let tmpChange: Point = {
      x: this.sortout( this._actor.position.x + this._hand.position.delta.x ),
      y: this.sortout( this._actor.position.y + this._hand.position.delta.y ),
    };

    // 暫時變更位置
    this.translate( this.sortout( tmpChange.x ), this.sortout( tmpChange.y ), 0, this._actor.scale );
  }
  @HostListener('touchend', ['$event']) onTouchEnd ( ev ) {

    // 重新儲存所有起始的觸碰點資訊
    this._hand.touches = [];
    [].forEach.call( ev.touches, value => {
      this._hand.touches.push({ x: value.clientX, y: value.clientY, id: value.identifier });
    });


    // // 碰觸點尚大於1
    // if ( this._hand.touches.length > 0 ) return;

    // 更新位置資訊
    this._actor.position.x = this.sortout( this._actor.position.x + this._hand.position.delta.x );
    this._actor.position.y = this.sortout( this._actor.position.y + this._hand.position.delta.y );
    this._actor.diagonal.x = this._actor.position.x + this._actor.size.width;
    this._actor.diagonal.y = this._actor.position.y + this._actor.size.height;
    
    // 滑動方向
    let Dx = ( this._hand.position.delta.x >= 0 ) ? 1 : -1;
    let Dy = ( this._hand.position.delta.y >= 0 ) ? 1 : -1; 
    // 速度 px / s
    let Vx = this.sortout( this._hand.position.delta.x / this.second( this._hand.time.delta ) );
    let Vy = this.sortout( this._hand.position.delta.y / this.second( this._hand.time.delta ) );
    // 角度
    let angle = Math.atan( Vy / Vx );
    // 摩擦力(方向合力)
    let F = 1 * 1000; 
    // X方向的摩擦力
    let Fx = this.sortout( Math.abs( ( F * Math.cos( angle ) ) ) );
    // Y方向的摩擦力
    let Fy = this.sortout( Math.abs( ( F * Math.sin( angle ) ) ) );
    // 模擬摩擦力，施加反方向的加速度
    let Ax = -Dx * Fx / 1;
    let Ay = -Dy * Fy / 1;
    // 1s為60幀，每次移動16.7ms
    let T = 1 / 60;

    // 開始滑動延續的動畫 模擬受摩擦力而慢慢停止
    // 1s為60幀, 1幀約16.7ms
    this.animate( () => {

      // 超過邊界
      if ( this._actor.position.x < this._bounding.position.x ) {
        // 轉向
        Dx = 1;
        Ax = -Dx * Fx / 1;
        // 回到邊界上所需的初速度
        Vx = this.sortout( Math.sqrt( -2 * Ax * ( this._bounding.position.x - this._actor.position.x ) ) );
      }
      if ( this._actor.position.y < this._bounding.position.y ) {
        // 轉向
        Dy = 1;
        Ay = -Dy * Fy / 1;
        // 回到邊界上所需的初速度
        Vy = this.sortout( Math.sqrt( -2 * Ay * ( this._bounding.position.y - this._actor.position.y ) ) );
      }
      if ( this._actor.diagonal.x > this._bounding.diagonal.x ) {
        // 轉向
        Dx = -1;
        Ax = -Dx * Fx / 1;
        // 回到邊界上所需的初速度
        Vx = this.sortout( -Math.sqrt( -2 * Ax * ( this._bounding.diagonal.x - this._actor.diagonal.x ) ) );
      }
      if ( this._actor.diagonal.y > this._bounding.diagonal.y ) {
        // 轉向
        Dy = -1;
        Ay = -Dy * Fy / 1;
        // 回到邊界上所需的初速度
        Vy = this.sortout( -Math.sqrt( -2 * Ay * ( this._bounding.diagonal.y - this._actor.diagonal.y ) ) );
      }

      // 1幀的位移量 受摩擦力影響會愈來愈少
      let Xx = this.sortout( ( Vx * T ) + ( Ax * Math.pow(T, 2) / 2 ) );
      let Xy = this.sortout( ( Vy * T ) + ( Ay * Math.pow(T, 2) / 2 ) );

      Vx = ( Dx < 0 && Vx < 0 || Dx > 0 && Vx > 0 ) ? this.sortout( Vx + Ax * T ) : 0;
      Vy = ( Dy < 0 && Vy < 0 || Dy > 0 && Vy > 0 ) ? this.sortout( Vy + Ay * T ) : 0;


      // 新的座標資訊
      let change = {
        position: {
          x: this._actor.position.x + Xx,
          y: this._actor.position.y + Xy,
        },
        diagonal: {
          x: this._actor.diagonal.x + Xx,
          y: this._actor.diagonal.y + Xy,
        },
      }

      this._actor.position.x = change.position.x;
      this._actor.position.y = change.position.y;
      this._actor.diagonal.x = this._actor.position.x + this._actor.size.width;
      this._actor.diagonal.y = this._actor.position.y + this._actor.size.height;

      // 改變位置
      this.translate( this.sortout( this._actor.position.x ), this.sortout( this._actor.position.y ) );

      // 停止位移動畫
      if ( Xx === 0 && Xy === 0 ) return false;      
      // 繼續下一幀的位移動畫
      return true;
    });
  }


  private sortout ( v ) {
    return ( ( v * 10 ) | 0 ) / 10;
    // return v | 0;
  }
  private second ( ms ) {
    return this.sortout( ms ) / 1000;
  }
  private render( x?: number, y?: number, z?:number, s?: number ) {
    if ( x !== undefined ) this._render.position.x = x;
    if ( y !== undefined ) this._render.position.y = y;
    if ( z !== undefined ) this._render.position.z = z;
    if ( s !== undefined ) this._render.scale = s;
    return this;
  }
  private renderX ( x?: number ) {
    if ( x !== undefined ) this._render.position.x = x;
    return this._render.position.x;
  }
  private renderY ( y?: number ) {
    if ( y !== undefined ) this._render.position.y = y;
    return this._render.position.y;
  }
  private renderZ ( z?: number ) {
    if ( z !== undefined ) this._render.position.z = z;
    return this._render.position.z;
  }
  private renderS ( s?: number ) {
    if ( s !== undefined ) this._render.scale = s;
    return this._render.scale;
  }
  private translate ( x?: number, y?: number, z?: number, s?: number ) {
    this.rdr.setElementStyle(this.actor, 'transform', 'translate3d(' + this.renderX(x) + 'px,' + this.renderY(y) + 'px,' + this.renderZ(z) + 'px) scale( ' + this.renderS(s)  + ' )');
    // this.rdr.setElementStyle(this.actor, 'transform', ' translate(' + this.renderX(x) + 'px,' + this.renderY(y) + 'px) scale( ' + this.renderS(s)  + ' )');
    return this;
  }
  private renderScale ( s: number ) {
    this.rdr.setElementStyle(this.actor, 'transform', ' translate3d(' + this.renderX() + 'px,' + this.renderY() + 'px,' + this.renderZ() + 'px) scale( ' + this.renderS(s)  + ' )');
    // this.rdr.setElementStyle(this.actor, 'transform', ' translate(' + this.renderX() + 'px,' + this.renderY() + 'px) scale( ' + this.renderS(s)  + ' )');
    return this;
  }
  // 16.7ms = 1000ms / 60fps
  private animate ( change ) {
    if ( change() ) {
      // console.log( 'next' );
      this._handler = requestAnimationFrame( () => this.animate( change ) );
    }else {
      // console.log( 'cancel' );
      this.stopAnimate();
    }
  }
  private stopAnimate () {
    cancelAnimationFrame( this._handler );
    this._handler = undefined;
  }
}
