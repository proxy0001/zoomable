import { ZoomablePage } from './app.po';

describe('zoomable App', () => {
  let page: ZoomablePage;

  beforeEach(() => {
    page = new ZoomablePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
