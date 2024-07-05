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
import { ColumnDefinition } from "./Table.js";


export class Cursor
{
   private errm$:string = null;
   private success$:boolean = true;
   private arrayfetch$:number = null;

   private rows$:number = 0;
   private pos$:number = -1;
   private id$:string = null;
   private data$:object[][] = [];
   private more$:boolean = false;
   private columns$:string[] = null;
   private coldef$:Map<string,ColumnDefinition> = null;


   constructor(private session:Session, coldef:Map<string,ColumnDefinition>, response:any)
   {
      this.coldef$ = coldef;
      this.columns$ = response.columns;

      this.id$ = response.cursor;
      this.more$ = response.more;
      this.data$ = response.rows;
      this.rows$ = this.data$.length;
   }


   public failed() : boolean
   {
      return(!this.success$);
   }


   public getErrorMessage() : string
   {
      return(this.errm$);
   }


   public fetched() : number
   {
      return(this.rows$);
   }


   public setArrayFetch(rows:number) : Cursor
   {
      this.arrayfetch$ = rows;
      return(this);
   }


   public async next() : Promise<boolean>
   {
      this.pos$++;

      if (this.pos$ < this.data$.length)
      {
         let cdef:ColumnDefinition = null;

         for (let i = 0; i < this.columns$.length; i++)
         {
            cdef = this.coldef$.get(this.columns$[i].toLowerCase());

            if (cdef != null && cdef.isDate() && this.data$[this.pos$][i])
               this.data$[this.pos$][i] = new Date(""+this.data$[this.pos$][i]);
         }
      }

      if (this.pos$ < this.data$.length)
         return(true);

      if (!this.more$)
         return(false);

      let request:any =
      {
         "Cursor":
         {
            "invoke": "fetch",
            "session": this.session.guid,
            "cursor": this.id$
         }
      }

      if (this.arrayfetch$ != null)
      {
         request.Cursor["fetch()"] =
         {"page-size": this.arrayfetch$}

         this.arrayfetch$ = null;
      }

      let response:any = await this.session.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (response.success)
      {
         this.pos$ = -1;
         this.more$ = response.more;
         this.data$ = response.rows;
         this.rows$ += this.data$.length;

         return(this.next());
      }

      return(false);
   }


   public async close() : Promise<boolean>
   {
      this.more$ = false;
      
      if (this.id$ == null)
         return(true);

      let request:any =
      {
         "Cursor":
         {
            "invoke": "close",
            "session": this.session.guid,
            "cursor": this.id$
         }
      }

      let response:any = await this.session.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      return(response.success);
   }


   public get(idx:number|string) : any
   {
      if (typeof idx === "string")
         idx = this.columns$.indexOf(idx.toLowerCase());

      return(this.data$[this.pos$][idx]);
   }


   public getRecord(lower?:boolean) : Map<string,object>
   {
      let rec:Map<string,object> = new Map<string,object>();

      for (let i = 0; i < this.columns$.length; i++)
      {
         let col:string = this.columns$[i];
         if (lower) col = col.toLowerCase();
         rec.set(col,this.data$[this.pos$][i]);
      }

      return(rec);
   }
}