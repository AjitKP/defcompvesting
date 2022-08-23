using {defcomp.vesting as dcv} from '../db/schema';

@path:'DCVService/Odata'
service DCVService {

    entity VestingDetails as projection on dcv.VestingDetails;

}