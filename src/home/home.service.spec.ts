import { Test, TestingModule } from '@nestjs/testing';
import { HomeService,homeSelect } from './home.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertyType } from '@prisma/client';

const mockGetHomes = [{
  id: 2,
  address: 12315,
  city: "Toronto",
  price: 12777,
  propertyType: PropertyType.RESIDENTIAL,
  image: "imag10",
  numberOfBedroom: 5,
  numberOfBathrooms: 5,
  images: [{
    url:"url1"
  }]
},]


describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HomeService,{
        provide:PrismaService,
        useValue:{
          home:{
            findMany: jest.fn().mockRejectedValue(mockGetHomes)
          }
        }
      }],
    }).compile();

    service = module.get<HomeService>(HomeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getHomes',()=>{
    const filters =  {
      city:"Toronto",
      price:{
        gte:1000,
        lte:150000,
      },
      propertyType:PropertyType.RESIDENTIAL
    }

    it('should call prisma home.findMany with correct params',async ()=>{
      const mockPrimaFindManyHomes = jest.fn().mockReturnValue(mockGetHomes)

      jest.spyOn(prismaService.home, "findMany").mockImplementation(mockPrimaFindManyHomes)

      await service.getHomes(filters)

      expect(mockPrimaFindManyHomes).toBeCalledWith({
        select:{
          ...homeSelect,
          images:{
            select:{
              url:true
            },
            take:1
          }
        },
        where: {
          ...filters
        }
      })
    })
  })
});
