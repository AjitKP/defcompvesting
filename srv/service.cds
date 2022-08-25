using {defcomp.vesting as dcv} from '../db/schema';

@path:'DCVService/Odata'
service DCVService {

    entity VestingDetails as projection on dcv.VestingDetails;

    type gaDetails {
        assignedYear: Integer;
        assignedAmount: Integer64;
        grantedDate: String(10);
        name: String(128);
        year: Integer;
        amount: Integer64;
    }

    type vaDetails {
        LYTotalGrantedAmount: Integer64;
        Rating: Integer;
        VestingPercent: Integer;
    }

    type calculatedData {
        year: Integer;
        GrantedAmount: Integer64;
        GADetails: array of gaDetails;
        GrantedDate: String(10);
        VestedAmount: Integer64;
        VestedDate: String(10);
        VADetails: vaDetails;
        PaymentDtae: String(10); 
        PaymentAmount: Integer64;
    }

    action updateLTIbyEmp(empid:String(128)) returns array of calculatedData;

}