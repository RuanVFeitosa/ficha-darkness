import {normalizeCameraSpeed,adjustCameraSpeed} from './cameraSpeed';
test('supports cinematic speeds down to 0.01x and retains normal speeds',()=>{
 expect(normalizeCameraSpeed(.01)).toBe(.01);
 expect(normalizeCameraSpeed(.05)).toBe(.05);
 expect(normalizeCameraSpeed(-1)).toBe(.01);
 expect(normalizeCameraSpeed(10)).toBe(5);
 expect(normalizeCameraSpeed('invalid')).toBe(1);
 expect(adjustCameraSpeed(1,1)).toBe(1.25);
 expect(adjustCameraSpeed(.25,-1)).toBe(.24);
 expect(adjustCameraSpeed(.02,-1)).toBe(.01);
 expect(adjustCameraSpeed(.01,-1)).toBe(.01);
});
