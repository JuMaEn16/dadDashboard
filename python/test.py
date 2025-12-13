import math

def dr_hyperbolic(D, K=100.0):
    # D: defense, K: half-point parameter
    if D <= 0:
        return 0.0
    return D / (D + K)

def dr_exponential(D, K=100.0):
    if D <= 0:
        return 0.0
    return 1.0 - math.exp(-D / K)

def dr_power(D, K=100.0, p=1.0):
    if D <= 0:
        return 0.0
    return (D**p) / (D**p + K**p)

def final_damage(incoming_damage, DR):
    return incoming_damage * (1.0 - DR)

# Example usage
for D in [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]:
    print("D=", D,
          " hyperbolic=", round(dr_hyperbolic(D,100)*100,3),
          "% exp=", round(dr_exponential(D,100)*100,3),
          "% power(p=0.85)=", round(dr_power(D,100,0.9)*100,3), "%")