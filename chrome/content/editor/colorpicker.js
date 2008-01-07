/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL
 *
 * The contents of this file are subject to the Mozilla Public License
 * (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the 'Color Picker'.
 *
 * The Initial Developer of the Original Code is
 * Neil Rashbrook
 *
 * Portions created by the Initial Developer are Copyright (C) 2000
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *     Shawn Wilsher
 *
 * ***** END LICENSE BLOCK ***** */

///////////////////////////////////////////////////////////////////////////////
//// Global Variables

var dialog;

///////////////////////////////////////////////////////////////////////////////
//// Initialization/Destruction

window.addEventListener("load", ColorPicker_initialize, false);

function ColorPicker_initialize()
{
  dialog = new ColorPicker();
}

///////////////////////////////////////////////////////////////////////////////
//// class LinkDialog

function ColorPicker()
{
  this.mData = window.arguments[0];
}

ColorPicker.prototype =
{
 /**
  * The function that is called on accept.  Sets data.
  */
  accept: function accept()
  {
    this.mData.color    = this.getHex();
    this.mData.accepted = true;
    return true;
  },

 /**
  * Obtains the hex value of the color.
  *
  * @return The hex value of the color.
  */
  getHex: function getHex()
  {
    var toHex = function toHex(d)
    {
      var hD = "0123456789ABCDEF";
      var h = hD.substr(d&15, 1);
      while (d > 15) {
        d >>= 4;
        h = hD.substr(d&15, 1) + h;
      }
      while (h.length < 2) {
        h = "0" + h;
      }

      return h;
    };

    var hex = toHex(document.getElementById("red").value);
    hex += toHex(document.getElementById("green").value);
    hex += toHex(document.getElementById("blue").value);
    
    return hex;
  }
}

      var dragging = null;
      var lastHue = 240, lastSat = 0, lastLum = 50;
      function dragColours(event) {
        var target = event.currentTarget;
        var x = event.clientX - target.boxObject.x;
        var y = event.clientY - target.boxObject.y;
        target.nextSibling.left = x;
        target.nextSibling.top = y;
        //x is hue 0..59..117..174 red..green..blue..red 0..120..240..359
        //y is saturation 0..186 is 100%..0%
        document.getElementById("hue").value = Math.round(x * 160 / 117);
        document.getElementById("sat").value = Math.round((186 - y) * 240 / 186);
        lastHue = x * 240 / 117;
        lastSat = (186 - y) * 100 / 186;
        updateLuminance();
        updateSwatch();
        updateRGB();
      }
      function updateLuminance() {
        var style = "background-color: hsl(" + lastHue + ", " + lastSat + "%, 50%);";
        document.getElementById("luminance").setAttribute("style", style);
      }
      function dragLuminance(event) {
        var target = event.currentTarget;
        var y = event.clientY - target.boxObject.y;
        target.lastChild.lastChild.top = y;
        document.getElementById("lum").value = Math.round((186 - y) * 240 / 186);
        lastLum = (186 - y) * 100 / 186;
        updateSwatch();
        updateRGB();
      }
      function validateHue() {
        var hue = document.getElementById("hue");
        if (!/^\d+$/.test(hue.value))
          hue.value = Math.round(lastHue / 1.5);
        else {
          if (parseInt(hue.value) > 239)
            hue.value = 239;
          lastHue = hue.value * 1.5;
          var target = document.getElementById("target");
          target.left = lastHue * 117 / 240;
          updateLuminance();
          updateSwatch();
          updateRGB();
        }
      }
      function validateSat() {
        var sat = document.getElementById("sat");
        if (!/^\d+$/.test(sat.value))
          sat.value = Math.round(lastSat * 2.4);
        else {
          if (parseInt(sat.value) > 240)
            sat.value = 240;
          lastSat = sat.value / 2.4;
          var target = document.getElementById("target");
          target.top = (100 - lastSat) * 186 / 100;
          updateLuminance();
          updateSwatch();
          updateRGB();
        }
      }
      function validateLum() {
        var lum = document.getElementById("lum");
        if (!/^\d+$/.test(lum.value))
          lum.value = Math.round(lastLum * 2.4);
        else {
          if (parseInt(lum.value) > 240)
            lum.value = 240;
          lastLum = lum.value / 2.4;
          var pointer = document.getElementById("pointer");
          pointer.top = (100 - lastLum) * 186 / 100;
          updateSwatch();
          updateRGB();
        }
      }
      function updateSwatch() {
        var style = "background-color: hsl(" + lastHue + ", " + lastSat + "%, " + lastLum + "%);";
        style += " border-width: 1px;"
        document.getElementById("colour").setAttribute("style", style);
      }
      function updateRGB() {
        var rgb = document.defaultView.getComputedStyle(document.getElementById("colour"), null).getPropertyValue("background-color").match(/\d+/g);
        document.getElementById("red").value = rgb[0];
        document.getElementById("green").value = rgb[1];
        document.getElementById("blue").value = rgb[2];
      }
      function validateRGB() {
        var red = document.getElementById("red").value;
        var green = document.getElementById("green").value;
        var blue = document.getElementById("blue").value;
        if (!/^\d+$/.test(red) || !/^\d+$/.test(green) || !/^\d+$/.test(blue))
          updateRGB();
        else {
          red -= 0;
          green -= 0;
          blue -= 0;
          if (red > 255)
            document.getElementById("red").value = red = 255;
          if (green > 255)
            document.getElementById("green").value = green = 255;
          if (blue > 255)
            document.getElementById("blue").value = blue = 255;
          var min = red > green ? green : red;
          var max = red + green - min;
          if (blue < min)
            min = blue;
          else if (blue > max)
            max = blue;
          var mid = red + green + blue - min - max;
          var sum = max + min;
          var diff = max - min;
          lastLum = sum * 100 / 510;
          if (sum > 255)
            sum = 510 - sum;
          lastSat = sum && diff * 100 / sum;
          if (!diff)
            lastHue = 240;
          else if (max == green)
            lastHue = 120 + (blue - red) * 60 / diff;
          else if (max == blue)
            lastHue = 240 + (red - green) * 60 / diff;
          else if (min == green)
            lastHue = 360 + (green - blue) * 60 / diff;
          else
            lastHue = (green - blue) * 60 / diff;
          if (lastHue * 117 / 240 >= 175)
            lastHue = 0;
          var target = document.getElementById("target");
          target.left = lastHue * 117 / 240;
          target.top = (100 - lastSat) * 186 / 100;
          var pointer = document.getElementById("pointer");
          pointer.top = (100 - lastLum) * 186 / 100;
          document.getElementById('hue').value = Math.round(lastHue / 1.5);
          document.getElementById('sat').value = Math.round(lastSat * 2.4);
          document.getElementById('lum').value = Math.round(lastLum * 2.4);
          updateLuminance();
          updateSwatch();
        }
    }
