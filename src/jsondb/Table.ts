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
import { FilterGroup } from "./filters/FilterGroup.js";


export class Table
{
   private errm$:string = null;
   private success$:boolean = true;

   private source$:string;
   private session$:Session;

   private order$:string = null;
   private primkey$:string[] = null;

   private coldef$:Map<string,ColumnDefinition> =
      new Map<string,ColumnDefinition>();


   public constructor(session:Session, source:string)
   {
      this.source$ = source;
      this.session$ = session;
   }


   public failed() : boolean
   {
      return(!this.success$);
   }


   public getErrorMessage() : string
   {
      return(this.errm$);
   }


   public get order() : string
   {
      return(this.order$);
   }


   public get source() : string
   {
      return(this.source$);
   }


   public get session() : Session
   {
      return(this.session$);
   }


   public setOrder(order:string) : Table
   {
      this.order$ = order;
      return(this);
   }


   public getColumnDefinitions() : Map<string,ColumnDefinition>
   {
      return(this.coldef$);
   }


   public async executeQuery(columns?:string|string[], filter?:FilterGroup) : Promise<Cursor>
   {
      if (!columns)
         columns = ["*"];

      if (!Array.isArray(columns))
         columns = [columns];

      await this.describe();
      if (this.failed()) return(null);

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
               "columns": columns,
               "page-size": 1
            }
         }
      }

      if (filter)
         request.Table["select()"].filters = filter.parse();

      if (this.order$ != null)
         request.Table["select()"].order = this.order$;

      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (response.success)
         return(new Cursor(this.session$,this.coldef$,response));

      return(null);
   }


   public async describe() : Promise<TableDefinition>
   {
      let definition:TableDefinition =
         DefinitionCache.get(this.source$);

      if (definition != null)
         return(definition);

      let request:any =
      {
         "Table":
         {
            "invoke": "describe",
            "source": this.source$,
            "session": this.session$.guid
         }
      }

      let column:ColumnDefinition = null;
      let response:any = await this.session$.invoke(request);

      this.errm$ = response.message;
      this.success$ = response.success;

      if (response.success)
      {
         definition = new TableDefinition();

         definition.order = response.order;
         definition.primarykey = response["primary-key"];

         definition.columns = [];

         response.rows.forEach(coldef =>
         {
            column = new ColumnDefinition();

            column.name = coldef.name;
            column.type = coldef.type;
            column.sqltype = coldef.sqltype;
            column.precision = coldef.precision;

            definition.columns.push(column);
         });

         if (this.order$ == null)
            this.order$ = definition.order;

         if (this.primkey$ == null)
            this.primkey$ = definition.primarykey;

         definition.columns.forEach((coldef) =>
         {this.coldef$.set(coldef.name.toLowerCase(),coldef)})

         DefinitionCache.add(this.source$,definition);
      }

      return(definition);
   }
}


export class ColumnDefinition
{
   public name:string;
   public type:string;
   public sqltype:number;
   public precision:number[]

   public isDate() : boolean
   {
      if (this.type.toLowerCase().indexOf("date") >= 0)
         return(true);

      if (this.type.toLowerCase().indexOf("timestamp") >= 0)
         return(true);

      return(false);
   }
}


export class TableDefinition
{
   public order:string;
   public primarykey:string[];
   public columns:ColumnDefinition[];
}


class DefinitionCache
{
   private static cache:Map<string,TableDefinition> =
      new Map<string,TableDefinition>();

   public static get(source:string) : TableDefinition
   {
      return(DefinitionCache.cache.get(source.toLowerCase()));
   }


   public static add(source:string, tdef:TableDefinition)
   {
      if (tdef != null)
         DefinitionCache.cache.set(source.toLowerCase(),tdef);
   }
}