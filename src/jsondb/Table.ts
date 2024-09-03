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

import { Query } from "./Query.js";
import { Insert } from "./Insert.js";
import { Update } from "./Update.js";
import { Delete } from "./Delete.js";
import { Record } from "./Record.js";
import { Cursor } from "./Cursor.js";
import { Session } from "./Session.js";
import { Messages } from "../messages/Messages.js";
import { FilterGroup } from "./filters/FilterGroup.js";
import { Filter, NameValuePair } from "./filters/Filters.js";


/**
 * AnySQL is the client side object that wraps the JsonWebDB table object.
 * A table object can be a table or view, and optionally use a custom select
 * statement when querying
 *
 * Depending of the operation to be executed on the "table" use one of the execute methods:
 *
 *    When using insert(), update() and delete() the backend returns the status.
 *    select() : Using this method, the backend will return a cursor.
 *
 * For more control use the createInsert, createUpdate, createDelete or createQuery to get
 * an object specifically made for this operation
 */
export class Table
{
   private errm$:string = null;
   private success$:boolean = true;

   private source$:string;
   private session$:Session;

   private order$:string = null;
   private primkey$:string[] = null;

   private bindvalues$:NameValuePair[] = null;

   private coldef$:Map<string,ColumnDefinition> =
      new Map<string,ColumnDefinition>();


   /**
    * @param session    The JsonWebDB session
    * @param source     The source sql
    * @param bindvalues Any bindvalues used in the sql
    */
   public constructor(session:Session, source:string, bindvalues?:NameValuePair[])
   {
      this.source$ = source;
      this.session$ = session;
      this.bindvalues$ = bindvalues;

      if (!source) throw Messages.get("SOURCE_IS_NULL","Table");
      if (!session) throw Messages.get("SESSION_IS_NULL","Table");
   }


   /**
    * @returns Whether an error has occured
    */
   public failed() : boolean
   {
      return(!this.success$);
   }


   /**
    * @returns The error-message from the backend
    */
   public getErrorMessage() : string
   {
      return(this.errm$);
   }


   /**
    * The default order by clause
    */
   public get order() : string
   {
      return(this.order$);
   }


   /**
    * The name of the source object
    */
   public get source() : string
   {
      return(this.source$);
   }


   /**
    * The JsonWebDB session
    */
   public get session() : Session
   {
      return(this.session$);
   }


   /**
    * Bindvalues
    */
   public get bindvalues() : NameValuePair[]
   {
      return(this.bindvalues$);
   }


   /**
    *
    * @param order Se the order by clause
    * @returns Itself
    */
   public setOrder(order:string) : Table
   {
      this.order$ = order;
      return(this);
   }


   /**
    * @returns A map of column name and definitions
    */
   public getColumnDefinitions() : Map<string,ColumnDefinition>
   {
      return(this.coldef$);
   }


   /**
    * @returns A class specifically targeted insert operations
    */
   public createInsert() : Insert
   {
      return(new Insert(this));
   }


   /**
    * @returns A class specifically targeted update operations
    */
   public createUpdate(filters?:Filter|Filter[]|FilterGroup|FilterGroup[]) : Update
   {
      return(new Update(this,filters));
   }


   /**
    * @returns A class specifically targeted delete operations
    */
   public createDelete(filters?:Filter|Filter[]|FilterGroup|FilterGroup[]) : Delete
   {
      return(new Delete(this,filters));
   }


   /**
    * @returns A class specifically targeted query operations
    */
   public createQuery(columns?:string|string[], filters?:Filter|Filter[]|FilterGroup|FilterGroup[]) : Query
   {
      return(new Query(this,columns,filters));
   }


   /**
    * @param record The record to insert into the table
    * @returns Whether the statement was executed successfully
    */
   public async insert(record:Record) : Promise<boolean>
   {
      let ins:Insert = new Insert(this);

      await ins.execute(record);
      this.success$ = !ins.failed();
      this.errm$ = ins.getErrorMessage();

      return(this.success$);
   }


   /**
    * @param record The record to holding changed values
    * @param filter The filter specifying the rows targeted
    * @returns The status
    */
   public async update(record:Record, filter?:FilterGroup) : Promise<boolean>
   {
      let upd:Update = new Update(this,filter);

      this.success$ = await upd.execute(record);
      this.errm$ = upd.getErrorMessage();

      return(this.success$);
   }


   /**
    * @param filter The filter specifying the rows targeted
    * @returns
    */
   public async delete(filter?:FilterGroup) : Promise<boolean>
   {
      let del:Delete = new Delete(this,filter);

      this.success$ = await del.execute();
      this.errm$ = del.getErrorMessage();

      return(this.success$);
   }


   /**
    *
    * @param columns    The columns to fetch
    * @param filter     The where-clause
    * @param close      Fetch and close the cursor in same roundtrip
    * @param arrayfetch The number of rows to fetch in each roundtrip
    * @returns
    */
   public async select(columns?:string|string[], filter?:FilterGroup, close?:boolean, arrayfetch?:number) : Promise<Cursor>
   {
      if (close == null)
         close = false;

      if (arrayfetch == null)
         arrayfetch = 1;

      let sel:Query = new Query(this,columns,filter);
      sel.setArrayFetch(arrayfetch).setOrder(this.order$).setCloseCursor(close);

      let cursor:Cursor = await sel.execute();

      this.success$ = !sel.failed();
      this.errm$ = sel.getErrorMessage();

      return(cursor);
   }


   /**
    * @returns The table definition
    */
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
            "session": this.session$.sessionID
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


/**
 * name        The column name
 * type        The type as string varchar...
 * sqltype     The actual and database specific type
 * precision   The column precision
 */
export class ColumnDefinition
{
   public name:string;
   public type:string;
   public sqltype:number;
   public precision:number[]

   /**
    * @returns Weather the column is s date type
    */
   public isDate() : boolean
   {
      if (this.type.toLowerCase().indexOf("date") >= 0)
         return(true);

      if (this.type.toLowerCase().indexOf("timestamp") >= 0)
         return(true);

      return(false);
   }
}


/**
 * columns     An array of column definitions
 * order       The default order by clause
 * primarykey  The primary key, if any
 */
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