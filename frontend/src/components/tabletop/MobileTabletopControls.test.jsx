import React from "react";
import {render,screen,fireEvent,act} from "@testing-library/react";
import MobileTabletopControls from "./MobileTabletopControls";
test("o joystick pressiona e solta as teclas de movimento", () => {
 jest.useFakeTimers();const down=jest.fn(),up=jest.fn();window.addEventListener("keydown",down);window.addEventListener("keyup",up);
 const start=jest.fn();const {unmount}=render(<MobileTabletopControls enabled onMoveStart={start}/>);
 const pad=screen.getByRole("group");pad.setPointerCapture=jest.fn();pad.getBoundingClientRect=() => ({left:0,top:0,width:100,height:100});
 const pointer=(type,x,y) => {const event=new Event(type,{bubbles:true,cancelable:true});Object.assign(event,{pointerId:1,clientX:x,clientY:y});fireEvent(pad,event);};
 pointer("pointerdown",50,10);act(() => jest.runOnlyPendingTimers());expect(down).toHaveBeenCalledWith(expect.objectContaining({key:"w"}));expect(start).toHaveBeenCalled();
 pointer("pointercancel",50,10);expect(up).toHaveBeenCalledWith(expect.objectContaining({key:"w"}));
 unmount();jest.useRealTimers();window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);
});
test("o joystick desativado não movimenta o personagem", () => {
 const start=jest.fn();render(<MobileTabletopControls enabled={false} onMoveStart={start}/>);
 fireEvent.pointerDown(screen.getByRole("group"));expect(start).not.toHaveBeenCalled();
});
