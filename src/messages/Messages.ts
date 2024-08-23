/*
  MIT License

  Copyright © 2023 Alex Høffner

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software
  and associated documentation files (the “Software”), to deal in the Software without
  restriction, including without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or
  substantial portions of the Software.

  THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { MessagesEN } from './MessagesEN.js';


export class Messages
{
   private static default:string = "EN";


   private static bundles:Map<string,Map<string,string>> =
      new Map<string,Map<string,string>>
      (
         [["EN",MessagesEN]]
      );


   public static get(msg:string, ...args:any) : string
   {
      let bundle:Map<string,string> = Messages.getBundle();
      let message:string = bundle.get(msg);

      if (!message) throw "Unknown message "+msg;

      for (let i = 0; args && i < args.length; i++)
         message = message.replaceAll("%"+(i+1),args[i]);

      return(message);
   }


   private static getBundle() : Map<string,string>
   {
      let lang:string = navigator.language;

      let pos:number = lang.indexOf("-");
      if (pos > 0) lang = lang.substring(0,pos);

      let bundle:Map<string,string> = Messages.bundles.get(lang.toUpperCase());
      if (bundle == null) bundle = Messages.bundles.get(Messages.default);

      return(bundle);
   }
}
