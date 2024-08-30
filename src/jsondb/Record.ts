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

/**
 * A Record holds name/value pairs of columns. Often retrieved from the database.
 * Records can be enriched by setting new values using a name and a value.
 */
export class Record
{
   private values$:any[] = [];
   private dict$:RecordDefinition;


   /**
    * @param dictionary The dictionary basically specifies a list of columns (see RecordDefinition)
    * @param values     Initial values for each column
    */
   public constructor(dictionary?:RecordDefinition, values?:any|any[])
   {
      this.dict$ = dictionary;

      if (this.dict$ && values)
      {
         if (!Array.isArray(values))
            values = [values];

         this.values$.push(...values);
      }

      if (!this.dict$)
         this.dict$ = new RecordDefinition();
   }


   /**
    * The columns currently defined for the record
    */
   public get columns() : string[]
   {
      return(this.dict$.columns);
   }


   /**
    * The values currently set for each column
    */
   public get values() : any[]
   {
      return(this.values$);
   }


   /**
    * @param column  The column name or position
    * @returns       The value of the column
    */
   public get(column:number|string) : any
   {
      if (typeof column == "string")
         column = this.dict$.getPosition(column);

      return(this.values$[column]);
   }


   /**
    * When adding values, you probably want to specify the column name, thus not just using the position
    * @param column The name or position
    * @param value  The value
    * @returns      Itself
    */
   public set(column:number|string, value:any) : Record
   {
      let pos:number = null;

      if (typeof column == "string")
      {
         pos = this.dict$.getPosition(column);

         if (pos == null)
         {
            this.dict$.add(column);
            pos = this.dict$.getPosition(column);
         }

         column = pos;
      }

      while(column >= this.values$.length)
         this.values$.push(null);

      this.values$[pos] = value;
      return(this);
   }


   /**
    * @returns Printable string representation
    */
   public toString() : string
   {
      let str:string = "";

      for (let i = 0; i < this.values$.length; i++)
      {
         if (i > 0) str += ",";
         str += "'"+this.values$[i]+"'";
      }

      return(str);
   }
}


/**
 * A dictionary containing names for each column
 */
export class RecordDefinition
{
   private columns$:string[] = [];

   private colindx$:Map<string,number> =
      new Map<string,number>();


   /**
    *
    * @param columns The initial columns
    */
   public constructor(columns?:string|string[])
   {
      this.add(columns);
   }


   /**
    * The columns currently defined
    */
   public get columns() : string[]
   {
      return(this.columns$);
   }


   /**
    * @param columns Add columns to the definition
    * @returns Itself
    */
   public add(columns:string|string[]) : RecordDefinition
   {
      if (columns == null)
         return(this);

      if (!Array.isArray(columns))
         columns = [columns];

      for (let i = 0; i < columns.length; i++)
      {
         this.columns$.push(columns[i]);
         this.colindx$.set(columns[i].toLowerCase(),i);
      }

      return(this);
   }


   /**
    * @param idx The position
    * @returns The column name
    */
   public getName(idx:number) : string
   {
      return(this.columns$[idx]);
   }


   /**
    * @param column The column name
    * @returns The position
    */
   public getPosition(column:string) : number
   {
      return(this.colindx$.get(column.toLowerCase()));
   }


   /**
    * Set the column name for a given position
    * @param idx  The position
    * @param column  The column name
    * @returns Itself
    */
   public setColumn(idx:number, column:string) : RecordDefinition
   {
      this.columns$[idx] = column;
      let keys:string[] = Array.from(this.colindx$.keys());

      for (let i = 0; i < keys.length; i++)
      {
         if (this.colindx$.get(keys[i]) == idx)
         {
            this.colindx$.delete(keys[i]);
            this.colindx$.set(column.toLowerCase(),idx);
            break;
         }
      }

      return(this);
   }
}