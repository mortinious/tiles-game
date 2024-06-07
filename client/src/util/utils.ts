export const getPossessiveName = (name: string) => {
    return name.match(/[sSxXzZ]$/) ? name : name + "s"
}