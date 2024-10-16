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

const version = "3.0.0";


/**
 * The Formsmodule is the entry class.
 */
export class FormsModule
{
   private static language$:string = null;

   protected constructor()
   {
   }

   /**
    * @returns The version of this library
    */
   public static version() : string
   {
      return(version);
   }


   /**
    * @returns The browser language
    */
   public static get Language() : string
   {
      if (FormsModule.language$)
         return(FormsModule.language$);

      FormsModule.language$ = navigator.language;
      let pos:number = FormsModule.language$.indexOf("-");
      if (pos > 0) FormsModule.language$ = FormsModule.language$.substring(0,pos);
      FormsModule.language$ = FormsModule.language$.toUpperCase();

      return(FormsModule.language$);
   }
}