import { Function, OntologyEditFunction, Edits, Timestamp } from "@foundry/functions-api";

// Uncomment the import statement below to start importing object types
import { Objects, Client, LeadershipRelation, ClientOrg } from "@foundry/ontology-api";

import { GPT_4o } from "@foundry/models-api/language-models"

import { Uuid } from "@foundry/functions-utils";

 


export class MyFunctions {

    @Edits(Client, LeadershipRelation, ClientOrg)
    @OntologyEditFunction()
    public async createRAGConnections(sp_fname: string, sp_lname: string, sp_role: string, sp_team: string, user_message: string, client_org_name: string): Promise<void> {
        
        console.log("starting")
        const curr_time = Timestamp.now()
        

        //first analysize the text
        const raw_connections = await this.analyze_message(sp_fname, sp_lname, sp_role, sp_team, user_message);

        //now parse into seperate stuff :3
        if(!raw_connections)
        {
            console.error("ChatGPT failed like an idiot lol")
            return
        }

        //if our query passes chat gpt, lets create our org!
        let client_org = Objects.search().clientOrg().filter(e=>e.organizationName.exactMatch(client_org_name)).all()[0]

        let org_id: string|null = null

        if(!client_org)
        {
            org_id = Uuid.random()
            client_org = Objects.create().clientOrg(org_id)
            client_org.organizationName = client_org_name
            
        }
        else {
            org_id = client_org.id
        }
        
        console.log(raw_connections)
        const connections = raw_connections.split(",")
        //console.log(connections)

        // begin object traversal!
        // Objects.create().client(Uuid.random())
        
        //so if say we get 20 veronica nguyens, we don't need to keep searching for them as they already appear in here
        const map_cache = new Map<string, Client>()

        //this is to prevent duplicate relationships from being created, may occur from pre prompts etcs
        //const relationship_cache = new Set<string>()

        console.log("connections:", connections)
        for(const connect_string_it in connections) {
            const connect_string = connections[connect_string_it]
            console.log(connect_string)
            console.log(connect_string.split(">"))
            const [person1, person2] = connect_string.split(">") 
            if (!person1 || !person2)
            {
                console.error("connection string is formatted incorrectly")
                return
            }
            //some basic javascript awesomeness
            const [first_name_1, last_name_1, role_1, team_1] = person1.split("_")
            const [first_name_2, last_name_2, role_2, team_2] = person2.split("_")

            const full_name_1 = first_name_1 + last_name_1
            const full_name_2 = first_name_2 + last_name_2

            //we can use caching here to remove the need to keep searching for objects if we've already seen them
            let sub_ord : Client | undefined;
            let boss_ord : Client | undefined;
            sub_ord = map_cache.get(full_name_1)
            boss_ord = map_cache.get(full_name_2)
            
            let boss_id = boss_ord?.id
            let subor_id = sub_ord?.id
            
            //if the object isnt cached we need to do more work
            if(!sub_ord)
            {
                sub_ord = Objects.search().client().filter(e=>e.firstname.exactMatch(first_name_1)).filter(e=>e.lastname.exactMatch(last_name_1)).filter(e=>e.orgName.exactMatch(client_org_name)).all()[0]
                //if we've never created this object then we need to now
                
                if(!sub_ord) {

                    subor_id = Uuid.random()
                    sub_ord = Objects.create().client(subor_id)
                    sub_ord.dateCreated = curr_time
                    this.update_object(sub_ord, first_name_1, last_name_1, role_1, team_1, org_id)
                    sub_ord.orgName = client_org_name
                }
                else {
                    subor_id = sub_ord.id
                }
                map_cache.set(full_name_1, sub_ord)
            }
            if(!boss_ord)
            {
                boss_ord = Objects.search().client().filter(e=>e.firstname.exactMatch(first_name_2)).filter(e=>e.lastname.exactMatch(last_name_2)).filter(e=>e.orgName.exactMatch(client_org_name)).all()[0]
                //if we've never created this object then we need to now
                if(!boss_ord) {
                    boss_id = Uuid.random()
                    boss_ord = Objects.create().client(boss_id)
                    boss_ord.dateCreated = curr_time
                    this.update_object(boss_ord, first_name_2, last_name_2, role_2, team_2, org_id)
                    boss_ord.orgName = client_org_name
                }
                else {
                    boss_id = boss_ord.id
                }

                map_cache.set(full_name_2, boss_ord)
            }
            //now create the link!
            //first we must check if this relationship already exists

            
            //ensure no repeats
            //if this is not null, then it exists, maybe a more efficient method exists?
            
            if(Objects.search().leadershipRelation().filter(e=>e.leader.exactMatch(boss_id!)).filter(e=>e.subordinate.exactMatch(subor_id!)).all()[0])
            {
                continue
            }

            const relationship = Objects.create().leadershipRelation(Uuid.random())
        
            relationship.relationshipOrg = client_org.id!
            relationship.relationshipOrgName = client_org_name
            relationship.leader = boss_ord.id
            relationship.subordinate = sub_ord.id
            relationship.dateCreated = curr_time
            
            
        }
        console.log("DONE")
        //all done! jaxon code :) no chat cuz i cant even access it in the office lol
    }
    
    @Function()
    private async analyze_message(sp_fname: string, sp_lname: string, sp_role: string, sp_team: string, user_message: string): Promise<string|undefined> {
        console.log("asking chat")
        const ask_name = `${sp_fname}_${sp_lname}_${sp_role}_${sp_team}`
        const response = await GPT_4o.createChatCompletion({
           params: {
               "temperature": 0.3,
           },
           messages: [
               {
                   role: "SYSTEM",
                    contents: [
                        {
                        text: `You are a model responsible for extracting and structuring hierarchical relationships within a company based on spoken transcripts.
                        You will receive data in the format: {firstname}_{lastname}_{role}_{team}: '{transcript}'
                        The speaker's information is given before the colon, and the transcript contains potential references to relationships.
                        
                        Your task: Extract relationships and return them in the following format:
                        
                        {firstname}_{lastname}_{role}_{team}>{firstname}_{lastname}_{role}_{team}
                        
                        Each connection represents a direct relationship.
                        Commas separate multiple connections.
                        Underscores _ separate attributes.
                        If data is missing, leave the relevant field blank but retain the underscore (e.g., gerald_hank__aws).
                        
                        Example:
                        
                        Input: veronica_liz_software engineer_aws: 'my boss for the AWS team is Gerald Hank, who answers to his manager Sarah'
                        
                        Output: veronica_liz_software engineer_aws>gerald_hank__aws,gerald_hank__aws>sarah__manager_
                        
                        Guidelines: Titles like "boss" or "manager" indicate hierarchical relationships. Do not infer relationships unless explicitly stated. Names must be captured as given. If only a first name appears, leave the last name blank (gerald___aws). Retain formatting consistency.
                        `
                        }
                    ]
               },
               { 
                   role: "USER", 
                    contents: [
                        { text: `${ask_name}:${user_message}`}
                    ] 
                }],
        })
        //console.log(response.choices[0].message.content)
        return response.choices[0].message.content;
    }


    @Function()
    private update_object(client: Client, fname: string, lname : string , role: string , team: string, org_id: string ): Client {
        client.firstname = fname
        client.lastname = lname
        client.position = role
        client.team = team
        return client
    }

    
    @Function()
    public async checkNewData(): Promise<boolean> {

        return true
    }

    @Edits(Client, LeadershipRelation, ClientOrg)
    @OntologyEditFunction()
    public async clearHierachyOrg(organization: string ) : Promise<void> {
        const org_ob = Objects.search().clientOrg().filter(e=>e.organizationName.exactMatch(organization)).all()
        
        console.log(organization)

        org_ob.forEach(e=>{
            e.delete()
        })
        //org_ob.delete()
        const clients_org_p = Objects.search().client()

        const clients_org = clients_org_p.filter(e=>e.orgName.exactMatch(organization)).all()

        const relations = Objects.search().leadershipRelation().filter(e=>e.relationshipOrgName.exactMatch(organization)).all()
        
        console.log("org delted")
        clients_org.forEach(e=> {
            console.log("deleted", e)
            e.delete()
        })
        console.log("clients delted")
       
        relations.forEach(e=> {
            console.log("deleted", e)
            e.delete()
        })
    }

    /*
    @Function()
    public myFunction(n: Integer): Integer {
         return n + 1;
    }

    // Note that "ExampleDataAircraft" may not exist in your ontology

    @Function()
    public async aircraftSearchExample(): Promise<ExampleDataAircraft[]> {
        const aircraft: ExampleDataAircraft[] = await Objects.search().exampleDataAircraft().allAsync();

        return aircraft;
    }

    @Function()
    public async aircraftAggregationExample(): Promise<TwoDimensionalAggregation<string>> {
        const aggregation = Objects.search().exampleDataAircraft()
                 .filter(aircraft => aircraft.arrivalCity.exactMatch('NYC'))
                 .groupBy(aircraft => aircraft.departureCity.topValues())
                 .count();

        return aggregation;
    }

    @OntologyEditFunction()
    public async aircraftEditExample(): Promise<void> {
        const aircraft = await Objects.search().exampleDataAircraft()
                 .filter(aircraft => aircraft.arrivalCity.exactMatch('NYC'))
                 .allAsync();

        aircraft.forEach(a => a.status = 'delayed');
    }
    */
}
