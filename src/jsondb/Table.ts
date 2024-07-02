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
import { Session } from "./Session.js";

export class Table
{
   private errm$:string;

   private source$:string;
   private session$:Session;

   private arrayfetch$:number = 16;

   private order$:string = null;
   private primkey$:string[] = null;
   private columns$:string[] = ["*"];


   public constructor(session:Session, source:string)
   {
      this.source$ = source;
      this.session$ = session;
   }


   public setOrder(order:string) : Table
   {
      this.order$ = order;
      return(this);
   }


   public setColumns(columns:string|string[]) : Table
   {
      if (!Array.isArray(columns))
         columns = [columns];

      this.columns$ = columns;
      return(this);
   }


   public async describe(useAsDefault?:boolean) : Promise<TableDefinition>
   {
      if (useAsDefault == null)
         useAsDefault = true;
      
      let request:any =
      {
         "Table":
         {
            "invoke": "describe",
            "source": this.source$,
            "session": this.session$.guid
         }
      }

      let definition:TableDefinition = null;
      let response:any = await this.session$.invoke(request);

      if (response.success)
      {
         definition = new TableDefinition();

         definition.order = response.order;
         definition.primarykey = response["primary-key"];

         definition.columns = [];

         response.rows.forEach(column =>
         {definition.columns.push(column);});

         if (useAsDefault)
         {
            this.columns$ = [];
            this.order$ = definition.order;
            this.primkey$ = definition.primarykey;

            definition.columns.forEach((coldef) =>
            {this.columns$.push(coldef.name.toLowerCase())})
         }
      }

      return(definition);
   }


   public async executeQuery(close?:boolean) : Promise<Cursor>
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
               "columns": this.columns$,
               "page-size": this.arrayfetch$
            }
         }
      }

      if (this.order$ != null)
         request.Table["select()"].order = this.order$;

      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      if (response.success) return(new Cursor(this.session$,this.columns$,response));

      return(null);
   }
}


export class ColumnDefinition
{
   public name:string;
   public type:string;
   public sqltype:number;
   public precision:number[]
}


export class TableDefinition
{
   public order:string;
   public primarykey:string[];
   public columns:ColumnDefinition[];
}