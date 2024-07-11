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

export class Record
{
   private dict$:Dictionary;
   private values$:any[] = [];


   public constructor(dictionary:Dictionary, values?:any|any[])
   {
      this.dict$ = dictionary;

      if (values)
      {
         if (!Array.isArray(values))
            values = [values];

         this.values$.push(...values);
      }
   }


   public get(column:number|string) : any
   {
      if (typeof column == "string")
         column = this.dict$.getPosition(column);

      return(this.values$[column]);
   }


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


export class Dictionary
{
   private columns$:string[] = [];

   private colindx$:Map<string,number> =
      new Map<string,number>();


   public constructor(columns?:string|string[])
   {
      this.add(columns);
   }


   public add(columns:string|string[]) : Dictionary
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


   public getName(idx:number) : string
   {
      return(this.columns$[idx]);
   }


   public getPosition(column:string) : number
   {
      return(this.colindx$.get(column.toLowerCase()));
   }


   public setColumn(idx:number, column:string) : Dictionary
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