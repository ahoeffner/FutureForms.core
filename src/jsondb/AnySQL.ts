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

import { Cursor } from "./Cursor.js";
import { Record } from "./Record.js";
import { Session } from "./Session.js";
import { NameValuePair } from "./filters/Filters.js";


export class AnySQL
{
   private errm$:string = null;
   private success$:boolean = true;

   private affected$:number = 0;
   private cursor$:Cursor = null;

   private source$:string;
   private session$:Session;

   private savepoint$:boolean = null;
   private returning$:string[] = null;

   private bindvalues$:NameValuePair[] = null;


   public constructor(session:Session, source:string, bindvalues?:NameValuePair[])
   {
      this.source$ = source;
      this.session$ = session;
      this.bindvalues$ = bindvalues;
   }


   public failed() : boolean
   {
      return(!this.success$);
   }


   public getErrorMessage() : string
   {
      return(this.errm$);
   }


   public affected() : number
   {
      return(this.affected$);
   }


   public getReturnValues() : Cursor
   {
      return(this.cursor$);
   }


   public setSavePoint(flag:boolean) : AnySQL
   {
      this.savepoint$ = flag;
      return(this);
   }


   public setReturnColumns(columns:string|string[]) : AnySQL
   {
      if (!Array.isArray(columns))
         columns = [columns];

      this.returning$ = columns;
      return(this);
   }


   public async insert(record:Record) : Promise<boolean>
   {
      let request:any =
      {
         "Sql":
         {
            "invoke": "insert",
            "source": this.source$,
            "session": this.session$.guid,

            "insert()":
            {
            }
         }
      }

      if (this.bindvalues$)
         request.Table.bindvalues = this.bindvalues$;

      if (this.savepoint$ != null)
         request.Table["insert()"].savepoint = this.savepoint$;

      if (this.returning$)
         request.Table["insert()"].returning = this.returning$;

      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (this.success$)
         this.affected$ = response.affected;

      return(this.success$);
   }


   public async update(record:Record) : Promise<boolean>
   {
      return(this.success$);
   }


   public async delete(record:Record) : Promise<boolean>
   {
      return(this.success$);
   }


   public async select(record:Record) : Promise<boolean>
   {
      return(this.success$);
   }
}