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

import { Session } from "./Session.js";


export class Cursor
{
   private pos$:number = -1;
   private id$:string = null;
   private data$:object[][] = [];
   private more$:boolean = false;
   private columns$:string[] = null;


   constructor(private session:Session, columns:string[], response:any)
   {
      this.columns$ = columns;

      for (let i = 0; i < columns.length; i++)
         this.columns$[i] = this.columns$[i].toLowerCase();

      this.id$ = response.cursor;
      this.more$ = response.more;
      this.data$ = response.rows;
   }


   public columns() : string[]
   {
      return(this.columns$);
   }


   public async next() : Promise<boolean>
   {
      this.pos$++;

      if (this.pos$ < this.data$.length)
         return(true);

      if (!this.more$)
         return(false);

      console.log("fetch");
      return(false);
   }


   public fetch() : object[]
   {
      return(this.data$[this.pos$]);
   }


   public getDate(idx:number|string) : Date
   {
      if (typeof idx === "string")
         idx = this.columns$.indexOf(idx);

      let val:any = this.data$[this.pos$][idx];
      if (val instanceof Date) return(val);

      if (typeof val === "string")
         return(new Date(val));

      return(null);
   }


   public getString(idx:number|string) : string
   {
      if (typeof idx === "string")
         idx = this.columns$.indexOf(idx);

      let val:any = this.data$[this.pos$][idx];
      if (val != null) return(val+"");
      return(null);
   }


   public getNumber(idx:number|string) : number
   {
      if (typeof idx === "string")
         idx = this.columns$.indexOf(idx);

      let val:any = this.data$[this.pos$][idx];
      if (val != null) return(+val);
      return(null);
   }


   public getBoolean(idx:number|string) : boolean
   {
      if (typeof idx === "string")
         idx = this.columns$.indexOf(idx);

      let val:any = this.data$[this.pos$][idx];

      if (typeof val === "boolean")
         return(val);

      if (typeof val === "string")
         return(val.toLowerCase() == "true");

      return(null);
   }
}