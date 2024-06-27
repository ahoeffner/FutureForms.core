export class Session
{
   private url$:URL = null;
   private vpd$:any[] = [];
   private clientinfo$:any[] = [];

   public get url() : URL
   {
      let url:URL = this.url$;

      if (url == null)
			url = new URL(window.location.origin);

      return(url);
   }


   public set url(url:URL|string)
   {
      if (typeof url === "string")
			url = new URL(url);

      this.url$ = url;
   }


   public connect(username:string, password?:string) : boolean
   {
      let request:any =
      {
         "Session":
         {
            "invoke": "connect()",

            "connect()":
            {
               "username": username,
               "password": password
            }
         }
      }

      let response:any = this.invoke(request);
      console.log(response);
      return(true);
   }


   private async invoke(payload:any) : Promise<any>
   {
      let errmsg:any = null;
      let success:boolean = true;

      let response:any = await fetch(this.url,{method: "POST", body: JSON.stringify(payload)})
        .catch((error) =>{success = false; errmsg = error});

      if (!success) throw errmsg;
      return(response.json());
   }
}