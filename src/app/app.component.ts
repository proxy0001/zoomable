import { Component, ViewChild } from '@angular/core';
import { ZoomableDirective } from './zoomable.directive';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild(ZoomableDirective) zoomable: ZoomableDirective;
  ngAfterViewInit () {
    this.zoomable.init();
  }
}
