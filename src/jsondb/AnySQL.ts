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
import { ColumnDefinition } from "./Table.js";
import { Messages } from "../messages/Messages.js";
import { NameValuePair } from "./filters/Filters.js";


export class AnySQL
{
   private errm$:string = null;
   private affected$:number = 0;
   private success$:boolean = true;

   private source$:string;
   private session$:Session;

   private savepoint$:boolean = null;
   private bindvalues$:NameValuePair[] = null;


   public constructor(session:Session, source:string, bindvalues?:NameValuePair|NameValuePair[])
   {
      this.source$ = source;
      this.session$ = session;

      if (bindvalues != null)
      {
         if (!Array.isArray(bindvalues))
            bindvalues = [bindvalues];

         this.bindvalues$ = bindvalues;
      }

      if (!source) throw Messages.get("SOURCE_IS_NULL","AnySQL");
      if (!session) throw Messages.get("SESSION_IS_NULL","AnySQL");
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


   public useSavePoint(flag:boolean) : AnySQL
   {
      this.savepoint$ = flag;
      return(this);
   }


   public async insert() : Promise<boolean>
   {
      let request:any =
      {
         "Sql":
         {
            "invoke": "insert",
            "source": this.source$,
            "session": this.session$.sessionID
         }
      }

      if (this.bindvalues$)
         request.Sql.bindvalues = this.bindvalues$;

      if (this.savepoint$ != null)
         request.Sql.savepoint = this.savepoint$;

      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (this.success$)
         this.affected$ = response.affected;

      return(this.success$);
   }


   public async update() : Promise<boolean>
   {
      let request:any =
      {
         "Sql":
         {
            "invoke": "update",
            "source": this.source$,
            "session": this.session$.sessionID
         }
      }

      if (this.bindvalues$)
         request.Sql.bindvalues = this.bindvalues$;

      if (this.savepoint$ != null)
         request.Sql.savepoint = this.savepoint$;

      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (this.success$)
         this.affected$ = response.affected;

      return(this.success$);
   }


   public async delete() : Promise<boolean>
   {
      let request:any =
      {
         "Sql":
         {
            "invoke": "delete",
            "source": this.source$,
            "session": this.session$.sessionID
         }
      }

      if (this.bindvalues$)
         request.Sql.bindvalues = this.bindvalues$;

      if (this.savepoint$ != null)
         request.Sql.savepoint = this.savepoint$;

      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (this.success$)
         this.affected$ = response.affected;

      return(this.success$);
   }


   public async select(close?:boolean, arrayfetch?:number) : Promise<Cursor>
   {
      if (close == null)
         close = false;

      if (arrayfetch == null)
         arrayfetch = 1;

      let request:any =
      {
         "Sql":
         {
            "invoke": "select",
            "source": this.source$,
            "session": this.session$.sessionID,

            "select()":
            {
               "page-size": arrayfetch
            }
         }
      }

      if (this.bindvalues$)
         request.Sql.bindvalues = this.bindvalues$;

      if (this.savepoint$ != null)
         request.Sql.savepoint = this.savepoint$;

      if (close)
         request.Sql["select()"].cursor = false;

      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (response.success)
      {
         let cols:string[] = [];
         let column:ColumnDefinition = null;

         let columns:Map<string,ColumnDefinition> =
            new Map<string,ColumnDefinition>();

         response.columns.forEach(coldef =>
         {
            column = new ColumnDefinition();

            column.name = coldef.name;
            column.type = coldef.type;
            column.sqltype = coldef.sqltype;
            column.precision = coldef.precision;

            cols.push(column.name);
            columns.set(column.name.toLowerCase(),column);
         });

         response.columns = cols;
         return(new Cursor(this.session$,columns,response));
      }

      return(null);
   }
}