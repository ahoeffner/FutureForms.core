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

import { Table } from "./Table.js";
import { Cursor } from "./Cursor.js";
import { Session } from "./Session.js";
import { FilterGroup } from "./filters/FilterGroup.js";


export class Query
{
   private errm$:string = null;
   private success$:boolean = true;

   private table$:Table;
   private source$:string;
   private session$:Session;
   private columns$:string[];
   private order$:string = null;
   private close$:boolean = false;
   private arrayfetch$:number = 16;
   private filter$:FilterGroup = null;


   public constructor(table:Table, columns?:string|string[], filter?:FilterGroup)
   {
      this.table$ = table;
      this.filter$ = filter;

      this.source$ = this.table$["source$"];
      this.session$ = this.table$["session$"];

      if (!columns)
         columns = ["*"];

      if (!Array.isArray(columns))
         columns = [columns];

      this.filter$ = filter;
      this.columns$ = columns;
   }


   public failed() : boolean
   {
      return(!this.success$);
   }


   public getErrorMessage() : string
   {
      return(this.errm$);
   }


   public setOrder(order:string) : Query
   {
      this.order$ = order;
      return(this);
   }


   public setArrayFetch(rows:number) : Query
   {
      this.arrayfetch$ = rows;
      return(this);
   }


   public setCloseCursor(close:boolean) : Query
   {
      this.close$ = close;
      return(this);
   }


   public async execute(...values:any)  : Promise<Cursor>
   {
      await this.table$.describe();

      let request:any = this.createRequest(values);
      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (response.success)
         return(new Cursor(this.session$,this.table$.getColumnDefinitions(),response));

      return(null);
   }


   public createRequest(...values:any) : any
   {
      let request:any =
      {
         "Table":
         {
            "invoke": "select",
            "source": this.source$,
            "session": this.session$.guid,

            "select()":
            {
               "heading": true,
               "columns": this.columns$,
               "page-size": this.arrayfetch$
            }
         }
      }

      if (this.filter$)
      {
         this.filter$.bind(values);
         request.Table["select()"].filters = this.filter$.parse();
      }

      if (this.close$)
         request.Table["select()"].cursor = false;


      if (this.order$ != null)
         request.Table["select()"].order = this.order$;

      return(request);
   }
}